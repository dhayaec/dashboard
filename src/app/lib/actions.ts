'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import prisma from './prisma';

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(['pending', 'paid']),
  date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

type InvoiceInsertData = {
  customerId: string;
  amountInCents: number;
  status: 'paid' | 'pending';
  date: string;
};

const insertInvoice = async ({
  customerId,
  amountInCents,
  status,
  date,
}: InvoiceInsertData) => {
  await prisma.invoice.create({
    data: {
      customerId, // `customerId` should match the Prisma model's field name
      amount: amountInCents, // Assuming `amount` is stored in cents
      status,
      date: new Date(date), // Convert to `Date` if `date` is a string in ISO format
    },
  });
};

export async function createInvoice(formData: FormData) {
  const { customerId, amount, status } = CreateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];
  try {
    insertInvoice({ customerId, amountInCents, status, date });
  } catch (error) {
    return {
      message: 'Database Error: Failed to Create Invoice.',
    };
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function updateInvoice(
  id: string,
  formData: FormData,
  page: string
) {
  const { customerId, amount, status } = UpdateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  const amountInCents = amount * 100;

  try {
    await prisma.invoice.update({
      where: { id },
      data: {
        customerId,
        amount: amountInCents,
        status,
      },
    });
  } catch (error) {
    return {
      message: 'Database Error: Failed to Update Invoice.',
    };
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
  //   throw new Error('Failed to Delete Invoice');

  try {
    await prisma.invoice.delete({
      where: { id },
    });
  } catch (error) {
    return {
      message: 'Database Error: Failed to Delete Invoice.',
    };
  }

  revalidatePath('/dashboard/invoices');
}
