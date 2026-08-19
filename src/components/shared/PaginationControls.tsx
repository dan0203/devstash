import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface PaginationControlsProps {
  basePath: string;
  currentPage: number;
  totalPages: number;
}

function pageHref(basePath: string, page: number): string {
  return page <= 1 ? basePath : `${basePath}?page=${page}`;
}

function getPageNumbers(currentPage: number, totalPages: number): (number | "ellipsis")[] {
  const pages = new Set<number>([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
  const sorted = [...pages].filter((page) => page >= 1 && page <= totalPages).sort((a, b) => a - b);

  const result: (number | "ellipsis")[] = [];
  let previous: number | undefined;
  for (const page of sorted) {
    if (previous !== undefined && page - previous > 1) {
      result.push("ellipsis");
    }
    result.push(page);
    previous = page;
  }
  return result;
}

export function PaginationControls({ basePath, currentPage, totalPages }: PaginationControlsProps) {
  if (totalPages <= 1) return null;

  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href={hasPrevious ? pageHref(basePath, currentPage - 1) : undefined}
            aria-disabled={!hasPrevious}
            className={!hasPrevious ? "pointer-events-none opacity-40" : undefined}
          />
        </PaginationItem>

        {getPageNumbers(currentPage, totalPages).map((page, index) =>
          page === "ellipsis" ? (
            <PaginationItem key={`ellipsis-${index}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={page}>
              <PaginationLink href={pageHref(basePath, page)} isActive={page === currentPage}>
                {page}
              </PaginationLink>
            </PaginationItem>
          )
        )}

        <PaginationItem>
          <PaginationNext
            href={hasNext ? pageHref(basePath, currentPage + 1) : undefined}
            aria-disabled={!hasNext}
            className={!hasNext ? "pointer-events-none opacity-40" : undefined}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
