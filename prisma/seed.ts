import bcrypt from 'bcrypt';
import {
  customers,
  invoices,
  revenue,
  users,
} from '../src/lib/placeholder-data';
import prisma from '../src/lib/prisma';

async function main() {
  // Seed users with hashed passwords
  await Promise.all(
    users.map(async (user) => {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      await prisma.user.upsert({
        where: { id: user.id },
        update: {},
        create: {
          id: user.id,
          name: user.name,
          email: user.email,
          password: hashedPassword,
        },
      });
    })
  );

  await Promise.all(
    customers.map(async (customer) => {
      await prisma.customer.upsert({
        where: { id: customer.id },
        update: {},
        create: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          imageUrl: customer.image_url,
        },
      });
    })
  );

  // Now insert invoices after customers are in place
  await Promise.all(
    invoices.map(async (invoice) => {
      await prisma.invoice.create({
        data: {
          customerId: invoice.customer_id, // Must match an existing customer id
          amount: invoice.amount,
          status: invoice.status,
          date: new Date(invoice.date), // Convert to ISO format
        },
      });
    })
  );

  // Seed revenue
  await Promise.all(
    revenue.map(async (rev) => {
      await prisma.revenue.upsert({
        where: { month: rev.month },
        update: {},
        create: {
          month: rev.month,
          revenue: rev.revenue,
        },
      });
    })
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
