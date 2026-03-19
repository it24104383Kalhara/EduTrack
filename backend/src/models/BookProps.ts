export type BookProps ={
  book_id?: number;  // optional, because new books might not have an ID yet
  isbn: string;
  title: string;
  author?: string;
  publisher?: string;
  published_year?: number;
  category?: string;
  description?: string;
  created_at?: Date;
}