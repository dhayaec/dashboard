import prisma from './prisma';
import { formatCurrency } from './utils/utils';

export async function fetchRevenue() {
  try {
    console.log('Fetching revenue data...');
    await new Promise((resolve) => setTimeout(resolve, 3000));
    const data = await prisma.revenue.findMany();
    console.log('Data fetch completed after 3 seconds.');

    return data;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch revenue data.');
  }
}

export type LatestInvoiceReturnValue = {
  amount: string;
  customer: { name: string; imageUrl: string; email: string };
  id: string;
  customerId: string;
  status: string;
  date: Date;
  userId: string | null;
};

export async function fetchLatestInvoices(): Promise<
  LatestInvoiceReturnValue[]
> {
  try {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const data = await prisma.invoice.findMany({
      take: 5,
      orderBy: { date: 'desc' },
      include: {
        customer: {
          select: {
            name: true,
            imageUrl: true,
            email: true,
          },
        },
      },
    });

    return data.map((invoice) => ({
      ...invoice,
      amount: formatCurrency(invoice.amount),
    }));
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch the latest invoices.');
  }
}

export async function fetchCardData() {
  try {
    const [invoiceCount, customerCount, paidStatus, pendingStatus] =
      await Promise.all([
        prisma.invoice.count(),
        prisma.customer.count(),
        prisma.invoice.aggregate({
          _sum: {
            amount: true,
          },
          where: { status: 'paid' },
        }),
        prisma.invoice.aggregate({
          _sum: {
            amount: true,
          },
          where: { status: 'pending' },
        }),
      ]);

    return {
      numberOfCustomers: customerCount,
      numberOfInvoices: invoiceCount,
      totalPaidInvoices: formatCurrency(paidStatus._sum.amount ?? 0),
      totalPendingInvoices: formatCurrency(pendingStatus._sum.amount ?? 0),
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch card data.');
  }
}

const ITEMS_PER_PAGE = 6;

export async function fetchFilteredInvoices(
  query: string,
  currentPage: number
) {
  try {
    const filters: any[] = [];

    // Conditionally add filters based on `query`
    if (query.trim()) {
      filters.push(
        { customer: { name: { contains: query } } },
        { customer: { email: { contains: query } } },
        { status: { contains: query } }
      );
    }

    const parsedAmount = parseFloat(query);
    if (!isNaN(parsedAmount)) {
      filters.push({ amount: { equals: parsedAmount } });
    }

    const parsedDate = new Date(query);
    if (!isNaN(parsedDate.getTime())) {
      filters.push({ date: { equals: parsedDate } });
    }

    const whereClause = filters.length > 0 ? { OR: filters } : {};

    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      skip: (currentPage - 1) * ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE,
      orderBy: { date: 'desc' },
      include: {
        customer: {
          select: {
            name: true,
            email: true,
            imageUrl: true,
          },
        },
      },
    });

    return invoices;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoices.');
  }
}

export async function fetchInvoicesPages(query: string) {
  try {
    const filters: any[] = [];

    // Apply filters conditionally
    if (query.trim()) {
      // Check if query is a non-empty string
      filters.push(
        { customer: { name: { contains: query } } },
        { customer: { email: { contains: query } } },
        { status: { contains: query } }
      );
    }

    const parsedAmount = parseFloat(query);
    if (!isNaN(parsedAmount)) {
      // Add amount filter if query is a valid number
      filters.push({ amount: { equals: parsedAmount } });
    }

    const parsedDate = new Date(query);
    if (!isNaN(parsedDate.getTime())) {
      // Add date filter if query is a valid date
      filters.push({ date: { equals: parsedDate } });
    }

    const whereClause = filters.length > 0 ? { OR: filters } : {};

    const count = await prisma.invoice.count({
      where: whereClause,
    });

    return Math.ceil(count / ITEMS_PER_PAGE);
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of invoices.');
  }
}
export async function fetchInvoiceById(
  id: string,
  customerId?: string,
  status?: string
) {
  try {
    // Conditionally build the where clause
    const whereClause: { id: string; customerId?: string; status?: string } = {
      id,
    };

    if (customerId) {
      whereClause.customerId = customerId;
    }

    if (status) {
      whereClause.status = status;
    }

    const invoice = await prisma.invoice.findFirst({
      where: whereClause,
      select: {
        id: true,
        customerId: true,
        amount: true,
        status: true,
      },
    });

    if (invoice) {
      invoice.amount = invoice.amount / 100; // Convert amount from cents to dollars
    }

    return invoice;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoice.');
  }
}

export async function fetchCustomers() {
  try {
    const customers = await prisma.customer.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: 'asc' },
    });

    return customers;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch all customers.');
  }
}

export async function fetchFilteredCustomers(query: string) {
  try {
    const customers = await prisma.customer.findMany({
      where: {
        OR: [{ name: { contains: query } }, { email: { contains: query } }],
      },
      select: {
        id: true,
        name: true,
        email: true,
        imageUrl: true,
        invoices: {
          select: {
            id: true,
            status: true,
            amount: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return customers.map((customer) => ({
      ...customer,
      total_invoices: customer.invoices.length,
      total_pending: formatCurrency(
        customer.invoices
          .filter((invoice) => invoice.status === 'pending')
          .reduce((sum, invoice) => sum + invoice.amount, 0)
      ),
      total_paid: formatCurrency(
        customer.invoices
          .filter((invoice) => invoice.status === 'paid')
          .reduce((sum, invoice) => sum + invoice.amount, 0)
      ),
    }));
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch customer table.');
  }
}
