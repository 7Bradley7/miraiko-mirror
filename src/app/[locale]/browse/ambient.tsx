"use client";

import Image from "next/image";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useState,
  type ReactNode,
} from "react";

/**
 * "Ambilight" effect of the art direction (Figma: 02 Browse → ambient): the page takes the
 * look of the title under the pointer or the keyboard focus.
 *
 * Two layers:
 * 1. Hero, at the top of the screen: the title's AniList banner (wide, high resolution, made
 *    for this), fading into the page further down. It stays in place while the cards
 *    scroll. Titles without a banner only have layer 2 (a stretched cover looked bad).
 * 2. Colours: the cover, very blurred, fixed behind the whole page, so the colours stay
 *    visible while scrolling.
 *
 * Crossfade: a new title waits until its image has loaded, then fades in while the previous
 * one fades out, at the same time. The previous one is removed once the fade is over.
 * All images come from AniList's CDN.
 */

type Cover = {
  /** Cover shown by the card, blurred behind the page. */
  src: string;
  /** Wide AniList banner, preferred for the hero. */
  bannerSrc?: string | null;
  color: string | null;
};
type Layer = Cover & { key: number };

const SetAmbientCover = createContext<(cover: Cover) => void>(() => {});

/** Only plain hex colours (AniList's cover colours) reach the page's style. */
export function safeColor(color: string | null | undefined): string | null {
  return color && /^#[0-9a-f]{6}$/i.test(color) ? color : null;
}

/** Only images from AniList's CDN (covers and banners) reach the page. */
export function isAniListCover(src: string | null | undefined): src is string {
  return Boolean(src?.startsWith("https://s4.anilist.co/file/anilistcdn/"));
}

/** Fade between two titles. */
const fadeClassName = "transition-opacity duration-700 ease-in-out motion-reduce:transition-none";

type State = {
  layers: Layer[];
  /** Title currently shown (image loaded). A newer layer waits, older ones fade out. */
  shownKey: number | null;
  nextKey: number;
};

type Action =
  | { type: "show"; cover: Cover }
  | { type: "loaded"; key: number }
  | { type: "fadedIn"; key: number };

export function ambientReducer(state: State, action: Action): State {
  switch (action.type) {
    case "show": {
      if (state.layers.at(-1)?.src === action.cover.src) return state;
      // Keep the title on screen, drop any title still loading: only the last one counts.
      const kept = state.layers.filter((layer) => layer.key === state.shownKey);
      return {
        ...state,
        layers: [...kept, { ...action.cover, key: state.nextKey }],
        nextKey: state.nextKey + 1,
      };
    }
    case "loaded":
      // The newest title's image is ready: it fades in while the previous one fades out.
      return state.layers.at(-1)?.key === action.key && state.shownKey !== action.key
        ? { ...state, shownKey: action.key }
        : state;
    case "fadedIn":
      // The fade is over: the previous titles, now invisible, can go.
      return action.key === state.shownKey
        ? { ...state, layers: state.layers.filter((layer) => layer.key >= action.key) }
        : state;
  }
}

/**
 * The sticky search bar tells the page how far down the "window" goes: over the cards, from
 * the top of the screen to just under the bar, the page shows the banner again, so the cards
 * disappear under the bar and the banner stays visible around it. Null: no window.
 */
const SetBackdropWindow = createContext<(height: number | null) => void>(() => {});

export function useBackdropWindow() {
  return useContext(SetBackdropWindow);
}

export function AmbientPage({ children }: { children: ReactNode }) {
  const [{ layers, shownKey }, dispatch] = useReducer(ambientReducer, {
    layers: [],
    shownKey: null,
    nextKey: 0,
  });
  const [windowHeight, setWindowHeight] = useState<number | null>(null);

  // Stable functions: components can depend on them without running again on every change.
  const setCover = useCallback((cover: Cover) => dispatch({ type: "show", cover }), []);
  const onLoaded = useCallback((key: number) => dispatch({ type: "loaded", key }), []);
  const onFadedIn = useCallback((key: number) => dispatch({ type: "fadedIn", key }), []);

  return (
    <SetAmbientCover.Provider value={setCover}>
      <SetBackdropWindow.Provider value={setWindowHeight}>
        <div className="relative isolate min-h-screen overflow-x-clip">
          <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
            <Backdrop
              layers={layers}
              shownKey={shownKey}
              onLoaded={onLoaded}
              onFadedIn={onFadedIn}
            />
          </div>

          {/* The window: the same backdrop, over the cards, down to just under the sticky bar.
              Both copies are fixed at the top of the screen, so they line up exactly. */}
          {windowHeight !== null && (
            <div
              aria-hidden="true"
              data-testid="ambient-window"
              className="pointer-events-none fixed inset-x-0 top-0 z-10 overflow-hidden"
              style={{ height: windowHeight }}
            >
              <div className="absolute inset-x-0 top-0 h-screen">
                <Backdrop layers={layers} shownKey={shownKey} />
              </div>
            </div>
          )}

          {children}
        </div>
      </SetBackdropWindow.Provider>
    </SetAmbientCover.Provider>
  );
}

/**
 * The two layers of the background, filling the screen. Only the main copy reports image
 * loads and fades (the window's copy follows the same state).
 */
function Backdrop({
  layers,
  shownKey,
  onLoaded,
  onFadedIn,
}: {
  layers: Layer[];
  shownKey: number | null;
  onLoaded?: (key: number) => void;
  onFadedIn?: (key: number) => void;
}) {
  const main = Boolean(onLoaded);
  return (
    <>
      {/* 2. Colours, behind the whole page. */}
      <div
        data-testid={main ? "ambient" : undefined}
        className="bg-night absolute inset-0 overflow-hidden"
      >
        {layers.map((layer) => (
          <div
            key={layer.key}
            data-cover={main ? layer.src : undefined}
            data-shown={main ? layer.key === shownKey : undefined}
            className={`absolute inset-0 ${fadeClassName} ${layer.key === shownKey ? "opacity-100" : "opacity-0"}`}
          >
            <Image
              src={layer.src}
              alt=""
              fill
              unoptimized
              sizes="100vw"
              className="scale-150 object-cover opacity-55 blur-[100px] saturate-[1.3]"
            />
          </div>
        ))}
        {/* Darker towards the bottom, where the cards are. */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,13,31,0.2)_0%,rgba(10,13,31,0.55)_55%,rgba(10,13,31,0.75)_100%)]" />
      </div>

      {/* 1. Hero: the banner at the top of the screen, fading down into the colours. */}
      <div
        data-testid={main ? "ambient-hero" : undefined}
        className="absolute inset-x-0 top-0 h-[min(70vh,640px)] overflow-hidden [mask-image:linear-gradient(180deg,#000_0%,#000_45%,transparent_100%)]"
      >
        {layers.map((layer) => {
          const shown = layer.key === shownKey;
          const banner = isAniListCover(layer.bannerSrc) ? layer.bannerSrc : null;
          return (
            <div
              key={layer.key}
              data-hero={main ? (banner ? "banner" : "none") : undefined}
              onTransitionEnd={(event) => {
                if (shown && event.target === event.currentTarget) onFadedIn?.(layer.key);
              }}
              className={`absolute inset-0 ${fadeClassName} ${shown ? "opacity-100" : "opacity-0"}`}
            >
              {banner ? (
                <Image
                  src={banner}
                  alt=""
                  fill
                  unoptimized
                  sizes="100vw"
                  onLoad={onLoaded && (() => onLoaded(layer.key))}
                  // A broken image must not block the background on the previous title.
                  onError={onLoaded && (() => onLoaded(layer.key))}
                  className="object-cover object-center opacity-80"
                />
              ) : (
                // No banner: nothing to wait for, only the colours change.
                onLoaded && <LoadedNow layerKey={layer.key} onLoaded={onLoaded} />
              )}
            </div>
          );
        })}
        {/* Keeps the title and the search readable: darker on the left. */}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,13,31,0.85)_0%,rgba(10,13,31,0.55)_35%,rgba(10,13,31,0.1)_70%,rgba(10,13,31,0)_100%)]" />
      </div>
    </>
  );
}

/** Reports right away, for layers without an image to wait for. */
function LoadedNow({ layerKey, onLoaded }: { layerKey: number; onLoaded: (key: number) => void }) {
  useEffect(() => onLoaded(layerKey), [layerKey, onLoaded]);
  return null;
}

/** Gives its title's look to the page when the card inside is hovered or focused. */
export function AmbientCard({
  cover,
  banner = null,
  color,
  children,
}: {
  cover: string | null;
  banner?: string | null;
  color: string | null;
  children: ReactNode;
}) {
  const setCover = useContext(SetAmbientCover);
  if (!isAniListCover(cover)) return <>{children}</>;
  const show = () => setCover({ src: cover, bannerSrc: banner, color });
  return (
    <div onPointerEnter={show} onFocus={show}>
      {children}
    </div>
  );
}

/** Sets the background from code, for example to the first result before any hover. */
export function useAmbientCover() {
  return useContext(SetAmbientCover);
}
