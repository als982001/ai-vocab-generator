import { History, LayoutDashboard, Settings } from "lucide-react";

import type { DisplayOptions, JlptLevel } from "../types";

interface SidebarProps {
  selectedLevel: JlptLevel;
  onLevelChange: (level: JlptLevel) => void;
  displayOptions: DisplayOptions;
  onDisplayOptionsChange: (options: DisplayOptions) => void;
}

export function Sidebar({
  selectedLevel,
  onLevelChange,
  displayOptions,
  onDisplayOptionsChange,
}: SidebarProps) {
  const jlptLevels: JlptLevel[] = ["N5", "N4", "N3", "N2", "N1"];

  return (
    <aside
      style={{
        width: "287px",
        height: "100%",
        backgroundColor: "rgb(249 249 249 / var(--tw-bg-opacity, 1))",
        overflowY: "auto",
        flexShrink: 0,
      }}
    >
      <div style={{ padding: "24px 24px 8px 24px" }}>
        <div className="flex flex-col" style={{ height: "57px" }}>
          <h1
            style={{
              lineHeight: "1.5",
              fontSize: "1.5rem",
              fontWeight: "700",
              letterSpacing: "-0.025rem",
            }}
          >
            Snap Voca
          </h1>
          <p
            style={{
              color: "rgb(107 114 128 / var(--tw-text-opacity, 1))",
              lineHeight: "1.5",
              fontWeight: "400",
              fontSize: "0.875rem",
            }}
          >
            Vocab Generator
          </p>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          padding: "16px",
          gap: "0.5rem",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            cursor: "pointer",
            height: "48px",
            padding: "12px 16px",

            // 현재 클릭된 메뉴
            backgroundColor: "rgb(229 229 229 / var(--tw-bg-opacity, 1))",
            borderRadius: "9999px",
          }}
        >
          <LayoutDashboard className="text-text-primary w-5 h-5" />
          <p
            style={{
              color: "rgb(23 23 23 / var(--tw-text-opacity, 1))", // 현재 메뉴
              lineHeight: "1.5",
              fontWeight: "700",
              fontSize: "0.875rem",
            }}
          >
            Dashboard
          </p>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            cursor: "pointer",
            height: "48px",
            padding: "12px 16px",
          }}
        >
          <History className="text-text-secondary group-hover:text-text-primary w-5 h-5" />
          <p
            style={{
              color: "rgb(107 114 128 / var(--tw-text-opacity, 1))",
              lineHeight: "1.5",
              fontWeight: "700",
              fontSize: "0.875rem",
            }}
          >
            History
          </p>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            cursor: "pointer",
            height: "48px",
            padding: "12px 16px",
          }}
        >
          <Settings className="text-text-secondary group-hover:text-text-primary w-5 h-5" />
          <p
            style={{
              color: "rgb(107 114 128 / var(--tw-text-opacity, 1))",
              lineHeight: "1.5",
              fontWeight: "700",
              fontSize: "0.875rem",
            }}
          >
            Settings
          </p>
        </div>
      </div>
      {/* 구분선 */}
      <div
        style={{
          backgroundColor: "rgb(224 224 224 / var(--tw-bg-opacity, 1))",
          width: "100%",
          height: "1px",
          margin: "8px 0px",
        }}
      />

      <div style={{ padding: "16px" }}>
        <h3
          style={{
            color: "rgb(107 114 128 / var(--tw-text-opacity, 1))",
            letterSpacing: "0.025rem",
            textTransform: "uppercase",
            fontWeight: "700",
            fontSize: "0.75rem",
            lineHeight: "1rem",
            padding: "0px 8px",
            marginBottom: "16px",
          }}
        >
          JLPT Level
        </h3>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.5rem",
            padding: "0px 8px",
          }}
        >
          {jlptLevels.map((level) => (
            <button
              key={level}
              onClick={() => onLevelChange(level)}
              style={{
                padding: "0px 16px",
                backgroundColor:
                  level === "N3"
                    ? "rgb(0 0 0 / var(--tw-bg-opacity, 1))"
                    : "rgb(229 229 229 / var(--tw-bg-opacity, 1))",
                border: "none",
                borderRadius: "9999px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "2rem",
              }}
            >
              <p
                style={{
                  color:
                    level === "N3"
                      ? "rgb(255 255 255 / var(--tw-text-opacity, 1))"
                      : "rgb(0 0 0 / var(--tw-text-opacity, 1))",
                  lineHeight: "1.5",
                  fontWeight: "700",
                }}
              >
                {level}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          padding: "8px 16px",
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
        }}
      >
        <h3
          style={{
            color: "rgb(107 114 128 / var(--tw-text-opacity, 1))",
            letterSpacing: "0.025em",
            textTransform: "uppercase",
            fontWeight: "700",
            fontSize: "0.75rem",
            lineHeight: "1rem",
            padding: "0px 8px",
            marginBottom: "8px",
          }}
        >
          Display Options
        </h3>
        <div
          style={{
            padding: "12px",
            border: "1px solid rgb(224 224 224 / var(--tw-border-opacity, 1))",
            display: "flex",
            backgroundColor: "rgb(255 255 255 / var(--tw-bg-opacity, 1))",
            borderRadius: "3rem",
            gap: "1rem",
            justifyContent: "space-between",
          }}
        >
          <div className="flex flex-col">
            <p
              style={{
                color: "rgb(23 23 23 / var(--tw-text-opacity, 1))",
                fontWeight: "700",
                fontSize: "0.875rem",
                lineHeight: "1.25rem",
              }}
            >
              Show Furigana
            </p>
          </div>
          <button
            onClick={() => {
              onDisplayOptionsChange({
                ...displayOptions,
                showFurigana: !displayOptions.showFurigana,
              });
            }}
            className="w-12 h-12 rounded-full bg-white shadow-sm border-2 border-gray-200 hover:border-primary transition-colors font-bold text-lg"
          >
            {displayOptions.showFurigana ? "O" : "X"}
          </button>
        </div>
        <div
          style={{
            padding: "12px",
            border: "1px solid rgb(224 224 224 / var(--tw-border-opacity, 1))",
            display: "flex",
            backgroundColor: "rgb(255 255 255 / var(--tw-bg-opacity, 1))",
            borderRadius: "3rem",
            gap: "1rem",
            justifyContent: "space-between",
          }}
        >
          <div className="flex flex-col">
            <p
              style={{
                color: "rgb(23 23 23 / var(--tw-text-opacity, 1))",
                fontWeight: "700",
                fontSize: "0.875rem",
                lineHeight: "1.25rem",
              }}
            >
              Show Romaji
            </p>
          </div>
          <button
            onClick={() => {
              onDisplayOptionsChange({
                ...displayOptions,
                showRomaji: !displayOptions.showRomaji,
              });
            }}
            className="w-12 h-12 rounded-full bg-white shadow-sm border-2 border-gray-200 hover:border-primary transition-colors font-bold text-lg"
          >
            {displayOptions.showRomaji ? "O" : "X"}
          </button>
        </div>
      </div>

      <div
        style={{
          marginTop: "auto",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "end",
          height: "calc(100vh - 600px)",
        }}
      >
        <div
          style={{
            padding: "12px",
            backgroundColor: "rgb(255 255 255 / var(--tw-bg-opacity, 1))",
            border: "1px solid rgb(224 224 224 / var(--tw-border-opacity, 1))",
            display: "flex",
            gap: "0.75rem",
            alignItems: "center",
            borderRadius: "3rem",
          }}
        >
          <div
            style={{
              color: "rgb(255 255 255 / var(--tw-text-opacity, 1))",
              fontWeight: "700",
              backgroundColor: "rgb(23 23 23 / var(--tw-bg-opacity, 1))",
              borderRadius: "9999px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "2.5rem",
              height: "2.5rem",
            }}
          >
            JD
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <p
              style={{
                color: "rgb(23 23 23 / var(--tw-text-opacity, 1))",
                fontWeight: "700",
                fontSize: "0.875rem",
                lineHeight: "1.25rem",
              }}
            >
              Jane Doe
            </p>
            <p
              style={{
                color: "rgb(107 114 128 / var(--tw-text-opacity, 1))",
                fontWeight: "700",
                fontSize: "0.75rem",
                lineHeight: "1rem",
              }}
            >
              Free Plan
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
