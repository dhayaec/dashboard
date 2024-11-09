import prisma from './prisma';

const ITEMS_PER_PAGE = 6;

export async function fetchFilteredInvoices(
  query: string,
  currentPage: number
) {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    const invoices = await prisma.invoice.findMany({
      skip: offset,
      take: ITEMS_PER_PAGE,
      orderBy: { date: 'desc' },
      where: {
        OR: [
          { customer: { name: { contains: query } } },
          { customer: { email: { contains: query } } },
          { amount: { equals: parseInt(query) || undefined } },
          { date: { equals: new Date(query).toISOString() || undefined } },
          { status: { contains: query } },
        ],
      },
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
