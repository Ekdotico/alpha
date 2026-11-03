import { Children, cloneElement, isValidElement, type ReactNode } from 'react';
import { ImageResponse } from 'next/og';
import { LogoMark } from '@ekdotico/domico/components';
import { oklchToHex } from '@ekdotico/domico/color';
import { palettes, scales } from '@ekdotico/domico/tokens';
import { SITE_META } from '@/lib/site';
import { SOCIAL_CARD } from '@/lib/seo';

// The card a shared link shows: the lockup, the hero's title, and the release
// status over the house gilt rule, on the Parchment Light canvas. Generated
// rather than a file in public/, so the size it declares is the size it is and
// the title cannot drift from the page. It replaces og.png, a 360×360 square of
// the arch mark the epsilon superseded, declared as 1200×630.
//
// Built once, at build time. Every colour is a Domico token, converted to hex
// with Domico's own maths because the renderer cannot paint oklch(); the mark
// is the package's own LogoMark.

export const alt = SOCIAL_CARD.alt;
export const size = { width: SOCIAL_CARD.width, height: SOCIAL_CARD.height };
export const contentType = 'image/png';

// A token that is not oklch() fails the build rather than painting nothing.
function hex(token: string): string {
  const value = oklchToHex(token);
  if (!value) throw new Error(`Not an oklch() token: ${token}`);
  return value;
}

const page = palettes.parchment.light;
const colour = {
  canvas: hex(page['bg-canvas']),
  ink: hex(page['fg-1']),
  quiet: hex(page['fg-3']),
  gilt: hex(page.gilt),
  rule: hex(page.rule),
};

const STATUS = `Closed alpha · ${new URL(SITE_META.siteUrl).host}`;

// Satori needs TrueType, which Google Fonts serves to a client that does not
// announce WOFF2 support. `text=` subsets the file to the glyphs drawn here.
async function googleFont(family: string, weight: number, text: string): Promise<ArrayBuffer> {
  const query = `family=${family.replace(/ /g, '+')}:wght@${weight}&text=${encodeURIComponent(text)}`;
  const css = await (await fetch(`https://fonts.googleapis.com/css2?${query}`)).text();
  const url = /src: url\((.+?)\) format\('(?:opentype|truetype)'\)/.exec(css)?.[1];
  if (!url) throw new Error(`No TrueType source for ${family} ${weight}`);
  return (await fetch(url)).arrayBuffer();
}

// The package's mark on its dark tile. LogoMark is a pure function, so calling
// it returns its <svg> tree; each fill it takes from a brand token
// (var(--logo-tile-dark-bg), var(--logo-tile-dark-ink)) becomes the token's hex.
// From the component rather than an asset file: a file read depends on the
// directory the server started in, and Turbopack rewrites module resolution to
// virtual paths.
function withBrandFills(node: ReactNode): ReactNode {
  if (!isValidElement<{ style?: { fill?: string }; children?: ReactNode }>(node)) return node;
  const fill = node.props.style?.fill?.replace(/^var\(--([a-z-]+)\)$/, (_, name: keyof typeof scales.brand) =>
    hex(scales.brand[name]),
  );
  return cloneElement(node, { style: undefined, ...(fill && { fill }) }, Children.map(node.props.children, withBrandFills));
}

export default async function OpenGraphImage() {
  const [serif, sans] = await Promise.all([
    googleFont('Crimson Pro', 400, `kdotico${SITE_META.tagline}`),
    googleFont('Commissioner', 400, STATUS),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 88px',
          background: colour.canvas,
          color: colour.ink,
          fontFamily: 'Crimson Pro',
        }}
      >
        {/* The lockup: the tile stands in for the E, one em square. */}
        <div style={{ display: 'flex', alignItems: 'flex-end', fontSize: 56, lineHeight: 1 }}>
          <div style={{ display: 'flex', marginRight: 3, marginBottom: 2 }}>
            {withBrandFills(LogoMark({ variant: 'dark-solid', size: 56, title: '' }))}
          </div>
          <span>kdotico</span>
        </div>

        <div style={{ display: 'flex', fontSize: 76, lineHeight: 1.12, maxWidth: 980 }}>
          {SITE_META.tagline}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {/* The house section rule: a 40px gilt lead over a neutral hairline. */}
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <div style={{ width: 40, height: 2, background: colour.gilt }} />
            <div style={{ flexGrow: 1, height: 1, background: colour.rule }} />
          </div>
          <div style={{ display: 'flex', marginTop: 22, fontFamily: 'Commissioner', fontSize: 28, color: colour.quiet }}>
            {STATUS}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Crimson Pro', data: serif, weight: 400 },
        { name: 'Commissioner', data: sans, weight: 400 },
      ],
    },
  );
}
