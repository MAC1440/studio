
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not set. Cannot send email.");
    return NextResponse.json({ error: 'Email service is not configured on the server.' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const {
      userName,
      userEmail,
      organizationName,
      ownerEmail,
      currentPlan,
      requestedPlan,
      planPrice,
    } = body;

    if (!userName || !userEmail || !organizationName || !ownerEmail || !currentPlan || !requestedPlan || !planPrice) {
        return NextResponse.json({ error: 'Missing required fields for sending email.' }, { status: 400 });
    }

    const subject = `Plan Change Request for ${organizationName}`;
    const emailBody = `
      <p>A user has requested a plan change for your organization, <strong>${organizationName}</strong>.</p>
      <ul>
        <li><strong>User:</strong> ${userName} (${userEmail})</li>
        <li><strong>Current Plan:</strong> ${currentPlan}</li>
        <li><strong>Requested Plan:</strong> ${requestedPlan}</li>
        <li><strong>New Price:</strong> ${planPrice}/month</li>
      </ul>
      <p>Please contact the user to arrange payment and update their subscription in the admin panel.</p>
    `;

    const { data, error } = await resend.emails.send({
      from: 'BoardR <noreply@resend.dev>',
      to: [ownerEmail],
      subject: subject,
      html: emailBody,
    });

    if (error) {
      console.error("Resend API error:", error);
      return NextResponse.json({ error: `Failed to send email: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ message: 'Email sent successfully', data });

  } catch (error) {
    console.error("Error in /api/send-email:", error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
