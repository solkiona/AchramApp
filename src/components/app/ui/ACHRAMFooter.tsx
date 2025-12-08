// src/components/app/ui/ACHRAMFooter.tsx
import Link from 'next/link'; // Import Link from next/link for client-side navigation if needed, or use plain <a>

export default function ACHRAMFooter() {
  return (
    <footer className="py-3 px-6 text-center text-xs text-achrams-text-secondary bg-achrams-bg-primary border-t border-achrams-border">
      <p>
        Designed, Built and Powered by{' '}
        <Link
          href="https://www.exceliantech.com" // Use the full URL for external links
          target="_blank" // Open in a new tab for external links
          rel="noopener noreferrer" // Security best practice for target="_blank"
          className="text-achrams-primary-solid hover:text-achrams-primary-dark transition-colors underline"
        >
          Excelian Technologies
        </Link>
      </p>
    </footer>
  );
}