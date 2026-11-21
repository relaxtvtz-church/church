import fs from 'node:fs';
import path from 'node:path';
import PDFDocument from 'pdfkit';
import { env } from '../../config/env.js';
import { theme } from '../../config/theme.js';
import { getUploadedImage } from '../../middleware/upload.js';
import { formatDate, RATING_LABELS } from '../../utils/format.js';
import type { ReviewRow } from '../reviews/reviews.service.js';

const BLUE = theme.primary;
const BLACK = theme.dark;
const GOLD = theme.secondary;
const WHITE = theme.white;
const SOFT = theme.background;
const MUTED = theme.muted;

const loadLogo = async (logoUrl: string | null): Promise<Buffer | null> => {
  if (!logoUrl) return null;
  if (logoUrl.startsWith('/uploads/')) {
    const file = await getUploadedImage(path.basename(logoUrl));
    return file?.data ?? null;
  }
  if (logoUrl.startsWith('/brand/')) {
    const filename = path.basename(logoUrl);
    const candidates = [
      path.join(env.frontendPublicDir, 'brand', filename),
      path.join(env.publicDir, 'brand', filename),
      path.join(path.dirname(env.uploadDir), 'public', 'brand', filename),
    ];
    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) return fs.readFileSync(candidate);
    }
  }
  return null;
};

export interface ReportData {
  title: string;
  subtitle: string;
  periodLabel: string;
  reviews: ReviewRow[];
  distribution: { rating: number; count: number }[];
  categories: { category: string; count: number; average: number | null }[];
  staffSummary: {
    full_name: string;
    position: string;
    total_reviews: number;
    average_rating: number | null;
  }[];
  settings: {
    church_name: string;
    logo_url: string | null;
    location: string | null;
    phone: string | null;
    email: string | null;
  };
  includeWrittenReviews: boolean;
}

const averageOf = (reviews: ReviewRow[]): string => {
  if (!reviews.length) return '—';
  const average = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  return average.toFixed(1);
};

export const buildReportPdf = async (data: ReportData): Promise<Buffer> => {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 48,
    bufferPages: true,
    info: {
      Title: `${data.title} — ${data.settings.church_name}`,
      Author: data.settings.church_name,
      Subject: 'Ministry feedback and staff review report',
    },
  });

  const chunks: Buffer[] = [];
  doc.on('data', (chunk) => chunks.push(chunk as Buffer));
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  const pageWidth = doc.page.width;
  const margin = doc.page.margins.left;
  const contentWidth = pageWidth - margin * 2;
  let y = 0;

  const newPageIfNeeded = (height: number): void => {
    if (y + height > doc.page.height - 70) {
      doc.addPage();
      y = margin;
    }
  };

  const sectionTitle = (title: string): void => {
    newPageIfNeeded(40);
    doc.font('Helvetica-Bold').fontSize(11).fillColor(BLACK).text(title.toUpperCase(), margin, y, { characterSpacing: 1 });
    y += 20;
    doc.moveTo(margin, y).lineTo(pageWidth - margin, y).strokeColor(theme.border).lineWidth(1).stroke();
    y += 14;
  };

  // Brand header
  const logo = await loadLogo(data.settings.logo_url);
  if (logo) {
    try {
      doc.image(logo, margin, 40, { fit: [52, 52] });
    } catch {
      drawMark(doc, margin, 40);
    }
  } else {
    drawMark(doc, margin, 40);
  }

  doc.font('Helvetica-Bold').fontSize(15).fillColor(BLACK).text(data.settings.church_name, margin + 64, 43, {
    width: contentWidth - 180,
  });
  doc.font('Helvetica').fontSize(8.5).fillColor(MUTED).text('MINISTRY FEEDBACK & STAFF REVIEW', margin + 64, 63);

  doc.font('Helvetica').fontSize(8).fillColor(MUTED).text('Date generated', pageWidth - margin - 150, 43, {
    width: 150,
    align: 'right',
  });
  doc.font('Helvetica-Bold').fontSize(9).fillColor(BLACK).text(formatDate(new Date().toISOString()), pageWidth - margin - 150, 55, {
    width: 150,
    align: 'right',
  });

  y = 105;
  doc.moveTo(margin, y).lineTo(pageWidth - margin, y).lineWidth(2).strokeColor(GOLD).stroke();
  y += 24;

  doc.font('Helvetica-Bold').fontSize(22).fillColor(BLACK).text(data.title, margin, y, { width: contentWidth });
  y += 30;
  doc.font('Helvetica').fontSize(10).fillColor(MUTED).text(data.subtitle, margin, y, { width: contentWidth });
  y += 16;
  doc.font('Helvetica-Bold').fontSize(9).fillColor(BLUE).text(data.periodLabel, margin, y, { width: contentWidth });
  y += 28;

  // Summary cards
  const cardGap = 10;
  const cardWidth = (contentWidth - cardGap * 3) / 4;
  const cards = [
    { label: 'TOTAL REVIEWS', value: String(data.reviews.length), color: BLACK },
    { label: 'AVERAGE RATING', value: averageOf(data.reviews), color: GOLD },
    { label: 'STAFF MEMBERS', value: String(data.staffSummary.length), color: BLACK },
    { label: 'CATEGORIES', value: String(data.categories.length), color: BLACK },
  ];
  cards.forEach((card, index) => {
    const x = margin + index * (cardWidth + cardGap);
    doc.roundedRect(x, y, cardWidth, 58, 6).fill(SOFT);
    doc.font('Helvetica').fontSize(7).fillColor(MUTED).text(card.label, x + 12, y + 12, { width: cardWidth - 24 });
    doc.font('Helvetica-Bold').fontSize(19).fillColor(card.color).text(card.value, x + 12, y + 27, {
      width: cardWidth - 24,
    });
  });
  y += 78;

  // Rating distribution
  sectionTitle('Rating Distribution');
  const maxCount = Math.max(1, ...data.distribution.map((item) => item.count));
  const barX = margin + 62;
  const barWidth = contentWidth - 150;
  [...data.distribution].reverse().forEach((item) => {
    newPageIfNeeded(24);
    doc.font('Helvetica').fontSize(8.5).fillColor(BLACK).text(`${item.rating} star${item.rating > 1 ? 's' : ''}`, margin, y + 1, {
      width: 55,
    });
    doc.roundedRect(barX, y, barWidth, 8, 4).fill(theme.track);
    if (item.count > 0) {
      doc.roundedRect(barX, y, Math.max(6, (item.count / maxCount) * barWidth), 8, 4).fill(GOLD);
    }
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(BLACK).text(String(item.count), barX + barWidth + 10, y, {
      width: 30,
    });
    y += 20;
  });
  y += 10;

  // Staff performance
  sectionTitle('Staff Performance Rating Summary');
  drawTable(doc, ['STAFF MEMBER', 'ROLE', 'REVIEWS', 'AVERAGE'], data.staffSummary.map((item) => [
    item.full_name,
    item.position || '—',
    String(item.total_reviews),
    item.average_rating === null ? '—' : item.average_rating.toFixed(1),
  ]), {
    margin,
    contentWidth,
    y,
    setY: (next) => {
      y = next;
    },
    newPageIfNeeded,
    widths: [0.32, 0.36, 0.16, 0.16],
  });
  y += 10;

  // Category summary
  sectionTitle('Feedback Categories Summary');
  if (data.categories.length) {
    drawTable(doc, ['CATEGORY', 'REVIEWS', 'AVERAGE'], data.categories.map((item) => [
      item.category,
      String(item.count),
      item.average === null ? '—' : item.average.toFixed(1),
    ]), {
      margin,
      contentWidth,
      y,
      setY: (next) => {
        y = next;
      },
      newPageIfNeeded,
      widths: [0.68, 0.16, 0.16],
    });
  } else {
    doc.font('Helvetica').fontSize(9).fillColor(MUTED).text('No feedback in the selected period.', margin, y);
    y += 20;
  }
  y += 12;

  // Written reviews
  if (data.includeWrittenReviews) {
    sectionTitle('Written Reviews');
    if (!data.reviews.length) {
      doc.font('Helvetica').fontSize(9).fillColor(MUTED).text('No written reviews in the selected period.', margin, y);
      y += 20;
    }
    data.reviews.forEach((review, index) => {
      const message = review.message || '';
      doc.font('Helvetica').fontSize(9);
      const messageHeight = doc.heightOfString(message, { width: contentWidth - 24 });
      newPageIfNeeded(messageHeight + 76);

      doc.roundedRect(margin, y, contentWidth, messageHeight + 64, 5).fill(SOFT);
      doc.font('Helvetica-Bold').fontSize(9.5).fillColor(BLACK).text(review.reviewer_name || 'Anonymous', margin + 12, y + 10, {
        width: contentWidth - 180,
      });
      doc.font('Helvetica').fontSize(8).fillColor(MUTED).text(formatDate(review.created_at), pageWidth - margin - 130, y + 11, {
        width: 118,
        align: 'right',
      });
      drawStars(doc, margin + 12, y + 28, review.rating);
      doc.font('Helvetica').fontSize(8).fillColor(MUTED)
        .text(`${RATING_LABELS[review.rating]}  •  ${review.category}  •  ${review.staff_name || 'General Church Feedback'}`,
          margin + 78, y + 27, { width: contentWidth - 90, ellipsis: true });
      doc.font('Helvetica').fontSize(9).fillColor(BLACK).text(message, margin + 12, y + 44, {
        width: contentWidth - 24,
        lineGap: 2,
      });
      y += messageHeight + 78;
      if (index < data.reviews.length - 1) newPageIfNeeded(10);
    });
  }

  // Footer on every page
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i += 1) {
    doc.switchToPage(i);
    // Keep footer text above the bottom margin so PDFKit does not auto-paginate it.
    const footerY = doc.page.height - 72;
    doc.moveTo(margin, footerY).lineTo(pageWidth - margin, footerY).strokeColor(theme.border).lineWidth(1).stroke();
    doc.font('Helvetica').fontSize(7.5).fillColor(MUTED).text('Confidential — Ministry leadership only', margin, footerY + 10, {
      width: 300,
    });
    doc.font('Helvetica').fontSize(7.5).fillColor(MUTED).text(`Page ${i - range.start + 1} of ${range.count}`, pageWidth - margin - 100, footerY + 10, {
      width: 100,
      align: 'right',
    });
  }

  doc.end();
  return done;
};

export interface RegistrationReportData {
  settings: {
    church_name: string;
    logo_url: string | null;
    location: string | null;
    phone: string | null;
    email: string | null;
  };
  periodLabel: string;
  search: string;
  registrations: {
    full_name: string;
    parent_name: string;
    email: string | null;
    phone: string | null;
    guardian_phone: string | null;
    location: string;
    status: string;
    studying_at: string | null;
    university: string | null;
    comments: string | null;
    created_at: string;
  }[];
}

export const buildRegistrationsPdf = async (data: RegistrationReportData): Promise<Buffer> => {
  const doc = new PDFDocument({
    size: 'A4',
    layout: 'landscape',
    margin: 40,
    bufferPages: true,
    info: {
      Title: `Registered People — ${data.settings.church_name}`,
      Author: data.settings.church_name,
      Subject: 'Freshers registration list',
    },
  });

  const chunks: Buffer[] = [];
  doc.on('data', (chunk) => chunks.push(chunk as Buffer));
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  const pageWidth = doc.page.width;
  const margin = doc.page.margins.left;
  const contentWidth = pageWidth - margin * 2;
  let y = 0;

  const newPageIfNeeded = (height: number): void => {
    if (y + height > doc.page.height - 70) {
      doc.addPage();
      y = margin;
    }
  };

  const sectionTitle = (title: string): void => {
    newPageIfNeeded(40);
    doc.font('Helvetica-Bold').fontSize(10).fillColor(BLACK).text(title.toUpperCase(), margin, y, { characterSpacing: 1 });
    y += 18;
    doc.moveTo(margin, y).lineTo(pageWidth - margin, y).strokeColor(theme.border).lineWidth(1).stroke();
    y += 12;
  };

  const logo = await loadLogo(data.settings.logo_url);
  if (logo) {
    try {
      doc.image(logo, margin, 34, { fit: [48, 48] });
    } catch {
      drawMark(doc, margin, 34);
    }
  } else {
    drawMark(doc, margin, 34);
  }

  doc.font('Helvetica-Bold').fontSize(14).fillColor(BLACK).text(data.settings.church_name, margin + 60, 36, {
    width: contentWidth - 200,
  });
  doc.font('Helvetica').fontSize(8).fillColor(MUTED).text('FRESHERS REGISTRATION RECORD', margin + 60, 55);
  doc.font('Helvetica').fontSize(8).fillColor(MUTED).text('Date generated', pageWidth - margin - 140, 36, {
    width: 140,
    align: 'right',
  });
  doc.font('Helvetica-Bold').fontSize(9).fillColor(BLACK).text(formatDate(new Date().toISOString()), pageWidth - margin - 140, 48, {
    width: 140,
    align: 'right',
  });

  y = 94;
  doc.moveTo(margin, y).lineTo(pageWidth - margin, y).lineWidth(2).strokeColor(GOLD).stroke();
  y += 22;

  doc.font('Helvetica-Bold').fontSize(20).fillColor(BLACK).text('Registered People', margin, y, { width: contentWidth });
  y += 26;
  doc.font('Helvetica').fontSize(10).fillColor(MUTED).text(data.settings.church_name, margin, y, { width: contentWidth });
  y += 15;
  doc.font('Helvetica-Bold').fontSize(9).fillColor(BLUE).text(data.periodLabel, margin, y, { width: contentWidth });
  if (data.search) {
    y += 14;
    doc.font('Helvetica').fontSize(8.5).fillColor(MUTED).text(`Search: "${data.search}"`, margin, y, { width: contentWidth });
  }
  y += 26;

  const students = data.registrations.filter((item) => item.status === 'Student').length;
  const withEmail = data.registrations.filter((item) => item.email).length;
  const withPhone = data.registrations.filter((item) => item.phone).length;
  const cardGap = 10;
  const cardWidth = (contentWidth - cardGap * 3) / 4;
  [
    { label: 'TOTAL REGISTERED', value: String(data.registrations.length), color: BLACK },
    { label: 'STUDENTS', value: String(students), color: GOLD },
    { label: 'WITH EMAIL', value: String(withEmail), color: BLACK },
    { label: 'WITH PHONE', value: String(withPhone), color: BLACK },
  ].forEach((card, index) => {
    const x = margin + index * (cardWidth + cardGap);
    doc.roundedRect(x, y, cardWidth, 52, 6).fill(SOFT);
    doc.font('Helvetica').fontSize(7).fillColor(MUTED).text(card.label, x + 10, y + 10, { width: cardWidth - 20 });
    doc.font('Helvetica-Bold').fontSize(17).fillColor(card.color).text(card.value, x + 10, y + 24, { width: cardWidth - 20 });
  });
  y += 70;

  sectionTitle('Registration List');
  drawTable(doc, ['FULL NAME', 'PARENT / GUARDIAN', 'PHONE', 'EMAIL', 'LOCATION', 'STATUS', 'UNIVERSITY / FROM', 'RECEIVED'],
    data.registrations.map((item) => [
      item.full_name,
      item.parent_name,
      item.phone || '—',
      item.email || '—',
      item.location,
      item.status,
      item.university || item.studying_at || '—',
      formatDate(item.created_at),
    ]),
    {
      margin,
      contentWidth,
      y,
      setY: (next) => {
        y = next;
      },
      newPageIfNeeded,
      widths: [0.15, 0.14, 0.11, 0.16, 0.13, 0.09, 0.14, 0.08],
    },
  );
  y += 12;

  const withComments = data.registrations.filter((item) => item.comments);
  if (withComments.length) {
    sectionTitle('Comments');
    withComments.forEach((item) => {
      const comment = item.comments || '';
      const height = doc.heightOfString(comment, { width: contentWidth - 20 });
      newPageIfNeeded(height + 34);
      doc.roundedRect(margin, y, contentWidth, height + 28, 5).fill(SOFT);
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor(BLACK).text(item.full_name, margin + 10, y + 8, {
        width: contentWidth - 20,
      });
      doc.font('Helvetica').fontSize(8.5).fillColor(BLACK).text(comment, margin + 10, y + 20, {
        width: contentWidth - 20,
        lineGap: 2,
      });
      y += height + 38;
    });
  }

  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i += 1) {
    doc.switchToPage(i);
    const footerY = doc.page.height - 66;
    doc.moveTo(margin, footerY).lineTo(pageWidth - margin, footerY).strokeColor(theme.border).lineWidth(1).stroke();
    doc.font('Helvetica').fontSize(7.5).fillColor(MUTED).text('Confidential — Ministry leadership only', margin, footerY + 9, {
      width: 300,
    });
    doc.font('Helvetica').fontSize(7.5).fillColor(MUTED).text(`Page ${i - range.start + 1} of ${range.count}`, pageWidth - margin - 100, footerY + 9, {
      width: 100,
      align: 'right',
    });
  }

  doc.end();
  return done;
};

const drawMark = (doc: PDFKit.PDFDocument, x: number, y: number): void => {
  doc.roundedRect(x, y, 52, 52, 10).fill(BLUE);
  doc.rect(x + 23, y + 13, 6, 26).fill(WHITE);
  doc.rect(x + 13, y + 23, 26, 6).fill(WHITE);
  doc.circle(x + 40, y + 13, 3).fill(GOLD);
};

const drawStars = (doc: PDFKit.PDFDocument, x: number, y: number, rating: number): void => {
  for (let i = 0; i < 5; i += 1) {
    doc.circle(x + i * 12 + 4, y + 3, 3.5).fill(i < rating ? GOLD : theme.emptyStar);
  }
};

interface TableOptions {
  margin: number;
  contentWidth: number;
  y: number;
  setY: (value: number) => void;
  newPageIfNeeded: (height: number) => void;
  widths: number[];
}

const drawTable = (
  doc: PDFKit.PDFDocument,
  headers: string[],
  rows: string[][],
  { margin, contentWidth, y, setY, newPageIfNeeded, widths }: TableOptions,
): void => {
  let currentY = y;
  const rowHeight = 20;
  const drawHeader = (): void => {
    doc.rect(margin, currentY, contentWidth, rowHeight).fill(theme.tableHeader);
    let x = margin + 8;
    headers.forEach((header, index) => {
      const width = contentWidth * widths[index] - 16;
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor(BLUE).text(header, x, currentY + 6, { width, ellipsis: true });
      x += contentWidth * widths[index];
    });
    currentY += rowHeight;
  };

  if (!rows.length) {
    doc.font('Helvetica').fontSize(9).fillColor(MUTED).text('No data available.', margin, currentY);
    setY(currentY + 20);
    return;
  }

  drawHeader();
  rows.forEach((row, index) => {
    const beforePage = doc.page;
    newPageIfNeeded(rowHeight + 4);
    if (doc.page !== beforePage) {
      currentY = margin;
      drawHeader();
    }
    if (index % 2 === 1) doc.rect(margin, currentY, contentWidth, rowHeight).fill(theme.rowAlt);
    let x = margin + 8;
    row.forEach((cell, cellIndex) => {
      const width = contentWidth * widths[cellIndex] - 16;
      doc.font(cellIndex === 0 ? 'Helvetica-Bold' : 'Helvetica').fontSize(8).fillColor(BLACK).text(cell, x, currentY + 6, {
        width,
        ellipsis: true,
      });
      x += contentWidth * widths[cellIndex];
    });
    currentY += rowHeight;
  });
  setY(currentY + 6);
};
