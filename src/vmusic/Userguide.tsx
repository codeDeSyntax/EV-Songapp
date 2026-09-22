import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Monitor,
  Music,
  Layers,
  Palette,
  Keyboard,
  FilePlus2,
  Edit3,
  HelpCircle,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Tv,
  Sliders,
  Maximize2,
  BookOpen,
  X,
  ChevronRight,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useAppDispatch } from "@/store";
import { setCurrentScreen } from "@/store/slices/appSlice";
import { setRightPanelView } from "@/store/slices/uiSlice";

interface GuideSection {
  id: string;
  title: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  articles: {
    title: string;
    description: string;
    steps?: string[];
    tips?: string[];
    shortcuts?: { key: string; action: string }[];
  }[];
}

const guideData: GuideSection[] = [
  {
    id: "getting-started",
    title: "Quick Start Guide",
    badge: "Basics",
    icon: Zap,
    description: "Get up and running with Song Cast in three simple steps.",
    articles: [
      {
        title: "How Song Cast Works",
        description:
          "Song Cast is your all-in-one worship lyrics presentation app. It is designed for church services, fellowship meetings, and presentations to project crisp song lyrics to your congregation with zero distraction.",
        steps: [
          "Select a song from your library on the left or type its name in the search bar.",
          "Preview the lyrics and verses in the middle workspace preview screen.",
          "Click 'Start Projection' or press Spacebar to project the active slide live to the congregation screen.",
        ],
        tips: [
          "Connect your projector or second monitor before launching Song Cast for automatic screen detection.",
          "Song Cast works completely offline — no internet connection is required during church services.",
        ],
      },
      {
        title: "Understanding the Main Workspace",
        description:
          "The main screen is arranged in an intuitive layout so you can find, preview, and project songs without searching through complex menus.",
        steps: [
          "Top Command Bar: Search songs instantly, switch fonts, start live projection, and access settings.",
          "Left Library Panel: Quick access to all songs stored on your computer, with instant filtering.",
          "Center Preview Screen: See exactly what the congregation will see before sending it live.",
          "Bottom Timeline / Slides: Click any verse or chorus to jump directly to that part of the song.",
        ],
      },
    ],
  },
  {
    id: "finding-songs",
    title: "Finding & Selecting Songs",
    badge: "Library",
    icon: Music,
    description: "Search by title or lyrics, filter by language, or browse your entire catalog.",
    articles: [
      {
        title: "Searching by Title or Lyrics",
        description:
          "Don't know the exact song title? Just type any words or phrases from the lyrics into the top search bar. Song Cast searches both song titles and slide contents in real time.",
        steps: [
          "Click the search bar in the titlebar (or start typing directly).",
          "Type any word from the song (e.g., 'Amazing Grace' or 'sweet the sound').",
          "Use the Up and Down arrow keys to highlight songs in the dropdown.",
          "Press Enter to select and load the highlighted song into your workspace.",
        ],
        tips: [
          "A live lyrics preview appears right in the search dropdown so you can confirm it's the right song before selecting it.",
        ],
      },
      {
        title: "Browsing the Full Catalog (All Songs View)",
        description:
          "When planning service order or looking for inspiration, open the master song catalog.",
        steps: [
          "Click the 'Browse All Songs' music icon in the top toolbar.",
          "Browse songs arranged neatly across 4 columns.",
          "Filter by language (English, Twi, Ga, Ewe) using the dropdown filter.",
          "Click any song to immediately stage it and return to the main workspace.",
        ],
      },
      {
        title: "Filtering by First Letter",
        description:
          "When the search dropdown is open, press any alphabet letter on your keyboard to instantly filter songs starting with that letter.",
      },
    ],
  },
  {
    id: "presenting",
    title: "Live Projection & Screens",
    badge: "Projection",
    icon: Tv,
    description: "Learn how to send lyrics to projectors and TVs smoothly.",
    articles: [
      {
        title: "Starting & Stopping Projection",
        description:
          "Send your lyrics to the church display screen or projector with a single click or key press.",
        steps: [
          "Click the 'Start Projection' monitor icon on the right side of the titlebar, or press Spacebar.",
          "The projector display window will open and show the active verse or chorus.",
          "To stop projection at any time, click the projector icon again.",
        ],
        shortcuts: [
          { key: "Spacebar", action: "Start projecting the active song" },
          { key: "Left / Right Arrow", action: "Switch to previous or next slide" },
          { key: "Esc", action: "Exit projection or clear dialogs" },
        ],
      },
      {
        title: "Navigating Slides Smoothly",
        description:
          "As the congregation sings, advance slides effortlessly using either your keyboard or mouse.",
        steps: [
          "Press the Right Arrow key (or Spacebar) to move forward to the next verse or chorus.",
          "Press the Left Arrow key to go back to the previous slide.",
          "Or simply click directly on any slide card in the preview panel to jump immediately to it.",
        ],
        tips: [
          "Automatic Font Sizing: Song Cast automatically calculates the best font size so words never get cut off on the screen.",
        ],
      },
      {
        title: "Repeating Choruses After Verses",
        description:
          "Many hymns and praise songs repeat the chorus after every single verse. You can turn on automatic chorus repetition so you don't have to manually click back and forth.",
        steps: [
          "Open Settings (the gear icon in the top toolbar).",
          "Go to the 'Chorus' section.",
          "Turn on 'Repeat Chorus After Verse'.",
          "Song Cast will now automatically sequence slides so the chorus follows every verse.",
        ],
      },
    ],
  },
  {
    id: "editing",
    title: "Creating & Editing Songs",
    badge: "Editor",
    icon: Edit3,
    description: "Add new hymns, edit verses, and format lyrics effortlessly.",
    articles: [
      {
        title: "Adding a New Song",
        description:
          "Add new songs to your church collection in seconds with automatic section detection.",
        steps: [
          "Click 'File' in the menu bar and choose 'New Song' (or click the + icon).",
          "Type the song title and select the language.",
          "Paste or type the lyrics into the text area. Use labels like 'Verse 1', 'Chorus', 'Verse 2' to separate parts.",
          "Song Cast automatically splits lines into clean, readable presentation slides.",
          "Click 'Save Song' to add it permanently to your song library.",
        ],
        tips: [
          "A structured example song ('Amazing Grace') is provided by default so you can see how formatting works.",
          "You can click anywhere outside the new song form to close it at any time.",
        ],
      },
      {
        title: "Editing Existing Songs",
        description:
          "Need to correct a typo, add a missing verse, or adjust verse order?",
        steps: [
          "Select the song in your library.",
          "Click the Edit pencil button in the actions card.",
          "Update the title or lyric text as needed.",
          "Click 'Save' to immediately apply your updates across all slides.",
        ],
      },
      {
        title: "Removing a Song",
        description:
          "To delete an unused song, select it and press the Delete key, or click the Trash icon. Song Cast will ask you to confirm before deleting to prevent accidental removals.",
      },
    ],
  },
  {
    id: "appearance",
    title: "Customizing Look & Feel",
    badge: "Appearance",
    icon: Palette,
    description: "Personalize background colors, darkness overlays, fonts, and themes.",
    articles: [
      {
        title: "Background Colors & Gradients",
        description:
          "Choose the visual atmosphere that best suits your sanctuary lighting and screen.",
        steps: [
          "Click the Settings gear icon in the top toolbar.",
          "Choose 'Color & Gradient' from the left menu.",
          "Pick from elegant preset gradients or select a rich solid color.",
          "Click 'Apply' to update the background on your projection screen.",
        ],
      },
      {
        title: "Background Darkness (Readability Overlay)",
        description:
          "Make sure your congregation can easily read lyrics even in bright rooms.",
        steps: [
          "In Settings, select 'Background'.",
          "Use the overlay slider to darken or lighten the background behind the words.",
          "A darker overlay increases contrast, making white text pop crisply from any distance.",
        ],
      },
      {
        title: "Selecting Presentation Fonts",
        description:
          "Customize the typeface used for projecting lyrics directly from the top toolbar.",
        steps: [
          "Click the font selector dropdown in the top titlebar (displays the active font, e.g., Arial).",
          "Scroll through installed fonts on your computer or type in the font search box.",
          "Click any font to apply it instantly to both the preview and the live projector.",
        ],
      },
      {
        title: "Light & Dark Mode",
        description:
          "Click the sun/moon Theme Toggle icon in the top toolbar to switch between comfortable daylight mode and dark mode designed for dark control rooms.",
      },
    ],
  },
  {
    id: "shortcuts",
    title: "Keyboard Shortcuts",
    badge: "Speed",
    icon: Keyboard,
    description: "Control your entire presentation using simple, fast keyboard shortcuts.",
    articles: [
      {
        title: "Essential Shortcuts Cheatsheet",
        description:
          "Mastering these quick keys lets you control your presentation smoothly without looking for mouse buttons.",
        shortcuts: [
          { key: "Spacebar", action: "Start projecting the staged song / advance slide" },
          { key: "Right Arrow (→)", action: "Go to the next slide" },
          { key: "Left Arrow (←)", action: "Go to the previous slide" },
          { key: "Up / Down (↑ / ↓)", action: "Navigate through search dropdown results" },
          { key: "Enter (↵)", action: "Select highlighted search result" },
          { key: "Esc", action: "Dismiss search dropdown, modals, or deselect song" },
          { key: "Delete", action: "Open confirmation to delete selected song" },
          { key: "Ctrl + S", action: "Jump directly to the Main Song Workspace" },
          { key: "Ctrl + H", action: "Jump to the Welcome Screen" },
        ],
      },
    ],
  },
  {
    id: "troubleshooting",
    title: "Helpful Tips & Troubleshooting",
    badge: "Support",
    icon: HelpCircle,
    description: "Answers to common questions and setup tips.",
    articles: [
      {
        title: "How to set up dual monitors (Projector Mode)",
        description:
          "To project lyrics on the church screen while keeping the control room workspace on your laptop:",
        steps: [
          "Plug in your projector cable (HDMI, VGA, or DisplayPort).",
          "Press the Windows Key + P on your keyboard.",
          "Select 'Extend' (do not choose Duplicate, so your laptop screen remains private).",
          "In Song Cast, click Start Projection — the presentation window will automatically occupy the second screen.",
        ],
      },
      {
        title: "Why did a long verse split into two slides?",
        description:
          "Song Cast is engineered to ensure lyrics are always large and readable from the very last row of your church. If a verse has many lines, it automatically splits into two clean, balanced slides so text never becomes tiny or hard to read.",
      },
      {
        title: "Returning to the Main Workspace from any view",
        description:
          "Any time you are in Settings, Statistics, Browse All Songs, or reading this guide, simply click the 'Main Workspace' button in the top toolbar to immediately return to your control room.",
      },
    ],
  },
];

const UserGuidePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const [activeSectionId, setActiveSectionId] = useState<string>("getting-started");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const handleBackToWorkspace = () => {
    dispatch(setCurrentScreen("Songs"));
    dispatch(setRightPanelView("bento"));
  };

  const handleGoHome = () => {
    dispatch(setCurrentScreen("Home"));
  };

  // Filter sections and articles based on search query
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return guideData;
    const query = searchQuery.toLowerCase().trim();

    return guideData
      .map((section) => {
        const matchesSection =
          section.title.toLowerCase().includes(query) ||
          section.description.toLowerCase().includes(query);

        const matchedArticles = section.articles.filter(
          (article) =>
            matchesSection ||
            article.title.toLowerCase().includes(query) ||
            article.description.toLowerCase().includes(query) ||
            article.steps?.some((step) => step.toLowerCase().includes(query)) ||
            article.tips?.some((tip) => tip.toLowerCase().includes(query)) ||
            article.shortcuts?.some(
              (sc) =>
                sc.key.toLowerCase().includes(query) ||
                sc.action.toLowerCase().includes(query),
            ),
        );

        if (matchedArticles.length > 0) {
          return { ...section, articles: matchedArticles };
        }
        return null;
      })
      .filter(Boolean) as GuideSection[];
  }, [searchQuery]);

  const activeSection =
    filteredSections.find((s) => s.id === activeSectionId) ||
    filteredSections[0] ||
    guideData[0];

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-app-bg text-app-text select-none">
      {/* ─── TOP NAVIGATION HEADER ─── */}
      <header className="h-14 border-b border-app-border bg-app-surface/60 backdrop-blur-md px-4 flex items-center justify-between flex-shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBackToWorkspace}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-app-accent hover:opacity-90 text-white text-xs font-medium transition-all active:scale-95 shadow-sm"
            title="Return to Song Cast workspace"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Workspace</span>
          </button>

          <div className="h-4 w-px bg-app-border mx-1" />

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-app-accent/20 flex items-center justify-center text-app-text">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-app-text leading-none">
                Song Cast User Guide
              </h1>
              <p className="text-[10px] text-app-text-muted mt-0.5">
                Simple, friendly guidance for worship presentation
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Real-time search bar */}
          <div className="relative w-64 md:w-80">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-app-text-muted pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search guides, features, shortcuts..."
              className="w-full h-8 pl-8 pr-8 rounded-full bg-app-bg border border-app-border text-xs text-app-text placeholder-app-text-muted focus:border-app-text transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-app-text-muted hover:text-app-text"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={handleGoHome}
            className="px-3 py-1.5 rounded-lg border border-app-border hover:bg-app-surface text-xs text-app-text-muted hover:text-app-text transition-colors"
            title="Go to Welcome Screen"
          >
            Welcome Screen
          </button>
        </div>
      </header>

      {/* ─── MAIN CONTENT BODY ─── */}
      <div className="flex-1 flex overflow-hidden">
        {/* ── LEFT SIDEBAR: Categories ── */}
        <aside className="w-64 md:w-72 border-r border-app-border bg-app-surface/30 flex flex-col flex-shrink-0">
          <div className="p-3 border-b border-app-border">
            <p className="text-[11px] font-semibold text-app-text-muted uppercase tracking-wider">
              Guide Topics
            </p>
          </div>

          <nav className="flex-1 p-2 space-y-1 overflow-y-auto thin-scrollbar">
            {filteredSections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection?.id === section.id;

              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSectionId(section.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all ${
                    isActive
                      ? "bg-app-accent text-white shadow-sm font-semibold"
                      : "text-app-text hover:bg-app-surface hover:text-app-text"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-white" : "text-app-text-muted"}`} />
                    <span className="text-xs truncate">{section.title}</span>
                  </div>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-wider font-semibold ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-app-surface text-app-text-muted border border-app-border"
                    }`}
                  >
                    {section.badge}
                  </span>
                </button>
              );
            })}

            {filteredSections.length === 0 && (
              <div className="p-4 text-center text-xs text-app-text-muted">
                No matching guide topics found. Try searching for "presentation", "search", or "shortcuts".
              </div>
            )}
          </nav>

          {/* Quick Help Footer Pill */}
          <div className="p-3 border-t border-app-border bg-app-surface/50">
            <div className="flex items-center gap-2 text-[11px] text-app-text-muted">
              <ShieldCheck className="w-3.5 h-3.5 text-app-accent" />
              <span>Offline Ready • No Internet Needed</span>
            </div>
          </div>
        </aside>

        {/* ── RIGHT MAIN ARTICLE AREA ── */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-app-bg thin-scrollbar">
          {activeSection ? (
            <motion.div
              key={activeSection.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="max-w-4xl mx-auto space-y-6"
            >
              {/* Category Header */}
              <div className="border-b border-app-border pb-4">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="w-8 h-8 rounded-xl bg-app-accent/20 flex items-center justify-center text-app-text">
                    <activeSection.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-app-text">
                      {activeSection.title}
                    </h2>
                    <p className="text-xs text-app-text-muted mt-0.5">
                      {activeSection.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Articles Grid */}
              <div className="space-y-5">
                {activeSection.articles.map((article, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl border border-app-border bg-app-surface/40 hover:bg-app-surface/60 transition-colors shadow-sm"
                  >
                    <h3 className="text-sm font-bold text-app-text mb-2 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-app-accent" />
                      {article.title}
                    </h3>
                    <p className="text-xs text-app-text-muted leading-relaxed mb-4">
                      {article.description}
                    </p>

                    {/* Step by step list */}
                    {article.steps && article.steps.length > 0 && (
                      <div className="mt-3 p-3.5 rounded-xl bg-app-bg/70 border border-app-border space-y-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-app-text-muted">
                          Step-by-Step:
                        </p>
                        <ol className="space-y-2">
                          {article.steps.map((step, sIdx) => (
                            <li key={sIdx} className="flex items-start gap-2.5 text-xs text-app-text leading-relaxed">
                              <span className="flex-shrink-0 w-4 h-4 rounded-full bg-app-accent text-white font-bold text-[10px] flex items-center justify-center mt-0.5">
                                {sIdx + 1}
                              </span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {/* Tips callout */}
                    {article.tips && article.tips.length > 0 && (
                      <div className="mt-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-1.5">
                        {article.tips.map((tip, tIdx) => (
                          <div key={tIdx} className="flex items-start gap-2 text-xs text-app-text">
                            <Sparkles className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
                            <span className="text-[11.5px] leading-relaxed">{tip}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Keyboard Shortcuts List */}
                    {article.shortcuts && article.shortcuts.length > 0 && (
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {article.shortcuts.map((sc, scIdx) => (
                          <div
                            key={scIdx}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-app-bg/80 border border-app-border text-xs"
                          >
                            <span className="text-app-text-muted text-[11px]">{sc.action}</span>
                            <kbd className="px-2 py-0.5 rounded-md bg-app-surface border border-app-border font-mono text-[10px] font-bold text-app-text shadow-sm ml-2 whitespace-nowrap">
                              {sc.key}
                            </kbd>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Bottom Helpful Callout */}
              <div className="p-4 rounded-2xl border border-app-border bg-app-surface/20 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-app-text">Ready to lead worship?</h4>
                  <p className="text-[11px] text-app-text-muted mt-0.5">
                    Return to the workspace whenever you're ready to project.
                  </p>
                </div>
                <button
                  onClick={handleBackToWorkspace}
                  className="px-4 py-2 rounded-xl bg-app-accent hover:opacity-90 text-white text-xs font-semibold shadow transition-all active:scale-95"
                >
                  Open Workspace
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="text-center py-16">
              <HelpCircle className="w-12 h-12 mx-auto text-app-text-muted opacity-40 mb-3" />
              <h3 className="text-base font-semibold text-app-text">No articles found</h3>
              <p className="text-xs text-app-text-muted mt-1">
                Try searching for a different term or clear your search query.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default UserGuidePage;
