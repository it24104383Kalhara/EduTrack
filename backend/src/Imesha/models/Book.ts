// src/models/Book.ts
import type { BookProps } from '../models/BookProps.ts';

export class Book {
  book_id?: number |undefined;
  isbn: string;
  title: string;
  author?: string;
  publisher?: string;
  published_year?: number;
  category?: string;
  description?: string;
  created_at?: Date;

  constructor(props: BookProps) {
    this.book_id = props.book_id;
    this.isbn = props.isbn;
    this.title = props.title;
    this.author = props.author || '';
    this.publisher = props.publisher || '';
    this.published_year = props.published_year ||0;
    this.category = props.category || '';
    this.description = props.description || '';
    this.created_at = props.created_at ? new Date(props.created_at) : new Date();
  }

  getSummary(): string {
    return `${this.title} by ${this.author || 'Unknown'} (${this.published_year || 'N/A'})`;
  }
}