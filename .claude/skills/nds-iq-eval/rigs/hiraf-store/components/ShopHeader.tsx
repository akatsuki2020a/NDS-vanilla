import Link from '@/components/Link';
import AppBar from '@mui/material/AppBar';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import CartButton from './CartButton';
import CategoryMenu from './CategoryMenu';
import LangSwitch from './LangSwitch';
import SearchBox from './SearchBox';
import { categories, categoryName } from '@/lib/data';
import type { Dictionary, Locale } from '@/lib/i18n';

export default function ShopHeader({ locale, t }: { locale: Locale; t: Dictionary }) {
  return (
    <AppBar position="sticky" color="primary" elevation={0}>
      <Toolbar sx={{ gap: 1, flexWrap: 'wrap', py: { xs: 1, md: 0 } }}>
        <Typography
          variant="h6"
          component={Link}
          href={`/${locale}`}
          sx={{ color: 'inherit', textDecoration: 'none', fontWeight: 700, marginInlineEnd: 2 }}
        >
          {t.brand.name}
        </Typography>
        <CategoryMenu
          label={t.nav.categories}
          allLabel={t.nav.allProducts}
          locale={locale}
          items={categories.map((c) => ({ id: c.id, name: categoryName(c, locale) }))}
        />
        <Button component={Link} href={`/${locale}/gift-box`} color="inherit">
          {t.nav.giftBox}
        </Button>
        <Box sx={{ flexGrow: 1 }} />
        <Box sx={{ order: { xs: 5, md: 0 }, width: { xs: '100%', md: 'auto' } }}>
          <SearchBox action={`/${locale}/products`} placeholder={t.nav.searchPlaceholder} label={t.nav.search} fullWidth />
        </Box>
        <LangSwitch locale={locale} label={t.nav.switchLang} ariaLabel={t.nav.switchLangLabel} />
        <CartButton locale={locale} label={t.nav.cart} />
      </Toolbar>
    </AppBar>
  );
}
