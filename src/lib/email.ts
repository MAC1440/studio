
'use server';

import { Resend } from 'resend';
import { getDoc, doc } from 'firebase/firestore';
import { db } from './firebase/config';
import type { User } from './types';

// Ensure the RESEND_API_KEY is available
if (!process.env.RESEND_API_KEY) {
  console.warn("RESEND_API_KEY is not set. Email functionality will be disabled.");
}

const resend = new Resend(process.env.RESEND_API_KEY);

type SendPlanChangeEmailArgs = {
  userName: string;
  userEmail: string;
  organizationName: string;
  organizationOwnerId: string;
  currentPlan: string;
  requestedPlan: string;
  planPrice: string;
};

export async function sendPlanChangeEmail(args: SendPlanChangeEmailArgs): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("Email service is not configured on the server.");
  }
  
  // Fetch the organization owner's email
  const ownerRef = doc(db, 'users', args.organizationOwnerId);
  const ownerSnap = await getDoc(ownerRef);
  if (!ownerSnap.exists()) {
      throw new Error("Organization owner not found.");
  }
  const ownerData = ownerSnap.data() as User;
  const ownerEmail = ownerData.email;

  const subject = `Plan Change Request for ${args.organizationName}`;
  const body = `
    <p>A user has requested a plan change for your organization, <strong>${args.organizationName}</strong>.</p>
    <ul>
      <li><strong>User:</strong> ${args.userName} (${args.userEmail})</li>
      <li><strong>Current Plan:</strong> ${args.currentPlan}</li>
      <li><strong>Requested Plan:</strong> ${args.requestedPlan}</li>
      <li><strong>New Price:</strong> ${args.planPrice}/month</li>
    </ul>
    <p>Please contact the user to arrange payment and update their subscription in the admin panel.</p>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: 'BoardR <noreply@resend.dev>', // You might want to use a custom domain in production
      to: [ownerEmail], // Send email to the organization owner
      subject: subject,
      html: body,
    });

    if (error) {
      console.error("Resend error:", error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    console.log("Plan change email sent successfully:", data);
  } catch (error) {
    console.error("Error in sendPlanChangeEmail:", error);
    throw error;
  }
}
