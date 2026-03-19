import type { BookProps } from '../models/BookProps.ts';
import { Book } from '../models/Book';
import db from '../config/db';

export class BookService {
  static async getByISBN(isbn: string): Promise<Book | null> {
    // Type assertion: tell TS this is RowDataPacket[]
    const [rows] = await db.query('SELECT * FROM books WHERE isbn = ?', [isbn]) as [BookProps[], any];

    const row = rows[0];
    if (!row) return null;

    return new Book(row);
  }
}