import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description?: string;
  name?: string;
  type?: string;
}

export const SEO: React.FC<SEOProps> = ({ 
  title, 
  description = "Aplikasi pembukuan toko modern. Kelola stok, transaksi, laba rugi, dan catatan usaha dengan mudah.",
  name = "Buku Saku",
  type = "website"
}) => {
  const currentUrl = window.location.href;

  return (
    <Helmet>
      {/* Standard metadata */}
      <title>{title} | {name}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={currentUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:title" content={`${title} | ${name}`} />
      <meta property="og:description" content={description} />
      <meta property="og:site_name" content={name} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={currentUrl} />
      <meta name="twitter:title" content={`${title} | ${name}`} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  );
};
