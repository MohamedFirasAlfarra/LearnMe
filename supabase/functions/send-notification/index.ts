import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  title: string;
  message: string;
  target_type: "all" | "specific_users" | "course_enrollees";
  target_course_id?: string;
  target_user_ids?: string[];
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-notification function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the user is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Check if user is admin
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (roleData?.role !== "admin") {
      throw new Error("Only admins can send notifications");
    }

    const { title, message, target_type, target_course_id, target_user_ids }: NotificationRequest = await req.json();

    console.log("Creating notification:", { title, target_type, target_course_id, target_user_ids });

    // Create the notification
    const { data: notification, error: notificationError } = await supabase
      .from("notifications")
      .insert({
        title,
        message,
        target_type,
        target_course_id: target_course_id || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (notificationError) {
      console.error("Error creating notification:", notificationError);
      throw notificationError;
    }

    console.log("Notification created:", notification.id);

    // Get target users based on target_type
    let targetUsers: { user_id: string; email: string; full_name: string }[] = [];

    if (target_type === "all") {
      const { data: allUsers, error: usersError } = await supabase
        .from("profiles")
        .select("user_id, email, full_name");
      
      if (usersError) throw usersError;
      targetUsers = allUsers || [];
    } else if (target_type === "specific_users" && target_user_ids) {
      const { data: specificUsers, error: usersError } = await supabase
        .from("profiles")
        .select("user_id, email, full_name")
        .in("user_id", target_user_ids);
      
      if (usersError) throw usersError;
      targetUsers = specificUsers || [];
    } else if (target_type === "course_enrollees" && target_course_id) {
      const { data: enrolledUsers, error: enrollError } = await supabase
        .from("enrollments")
        .select("user_id, profiles!inner(user_id, email, full_name)")
        .eq("course_id", target_course_id);
      
      if (enrollError) throw enrollError;
      targetUsers = (enrolledUsers || []).map((e: any) => ({
        user_id: e.profiles.user_id,
        email: e.profiles.email,
        full_name: e.profiles.full_name,
      }));
    }

    console.log(`Found ${targetUsers.length} target users`);

    // Create notification recipients and send emails
    const emailPromises: Promise<any>[] = [];
    const recipientInserts: any[] = [];

    for (const targetUser of targetUsers) {
      recipientInserts.push({
        notification_id: notification.id,
        user_id: targetUser.user_id,
        email_sent: true,
      });

      // Send email if user has an email
      if (targetUser.email) {
        emailPromises.push(
          resend.emails.send({
            from: "Notifications <onboarding@resend.dev>",
            to: [targetUser.email],
            subject: title,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #333; font-size: 24px; margin-bottom: 16px;">${title}</h1>
                <p style="color: #555; font-size: 16px; line-height: 1.6;">${message}</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
                <p style="color: #888; font-size: 14px;">مرحباً ${targetUser.full_name || ""},</p>
                <p style="color: #888; font-size: 14px;">هذا إشعار من منصتنا التعليمية.</p>
              </div>
            `,
          }).catch((err) => {
            console.error(`Failed to send email to ${targetUser.email}:`, err);
            return null;
          })
        );
      }
    }

    // Insert all recipients
    if (recipientInserts.length > 0) {
      const { error: recipientError } = await supabase
        .from("notification_recipients")
        .insert(recipientInserts);

      if (recipientError) {
        console.error("Error inserting recipients:", recipientError);
      }
    }

    // Wait for all emails to be sent
    const emailResults = await Promise.all(emailPromises);
    const successfulEmails = emailResults.filter(r => r !== null).length;

    console.log(`Sent ${successfulEmails} emails out of ${emailPromises.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        notification_id: notification.id,
        recipients_count: targetUsers.length,
        emails_sent: successfulEmails,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
