// src/types/Book.ts

export interface Book {
  book_id?: number;
  isbn: string;
  title: string;
  author?: string;
  publisher?: string;
  published_year?: number;
  category?: string;
  description?: string;
}