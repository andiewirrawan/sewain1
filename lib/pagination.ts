
export function getPagination(page: number, size: number) {
  const limit = size ? +size : 10;
  const from = page ? (page - 1) * limit : 0;
  const to = from + limit - 1;

  return { from, to, limit };
}

export function formatPaginatedResponse(data: any[], count: number | null, page: number, limit: number) {
  const total = count || 0;
  const totalPages = Math.ceil(total / limit);
  
  return {
    data,
    pagination: {
      total,
      page,
      limit,
      total_pages: totalPages
    }
  };
}
