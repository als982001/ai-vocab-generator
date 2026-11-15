// 의존성 없는 순수 모듈. Playwright 순수 테스트가 직접 import하므로 `~` 런타임 import를 쓰지 않는다
// (타입은 상대경로 import type이라 런타임에 지워진다)
import type { IJsonArrayItemScanner } from "../types";

/**
 * 스트리밍으로 조각나 들어오는 JSON 텍스트에서 최상위 배열의 객체 원소를 완성되는 즉시 꺼내는 스캐너를 만듦
 * - 최상위가 배열일 때만 방출 (최상위 객체면 아무것도 방출하지 않음)
 * - 배열의 객체 원소만 방출 (null·숫자·문자열·배열 원소는 건너뜀)
 * - 문자열 안의 괄호·따옴표·이스케이프를 구분하므로 조각 경계가 어디서 갈려도 결과가 같다
 * - 최상위 배열이 닫힌 뒤의 입력은 무시
 * 최종 결과가 아니라 진행 표시용. 최종 검증은 전체 텍스트를 JSON.parse해서 따로 한다
 * @return push 텍스트 조각을 넣으면 이번 조각으로 완성된 원소들을 돌려주는 함수
 */
export function createJsonArrayItemScanner(): IJsonArrayItemScanner {
  let depth = 0;
  let isInString = false;
  let isEscaped = false;
  let isFinished = false;
  let isTopLevelArray: boolean | null = null;

  // 수집 중인 원소 텍스트 (원소 밖이면 null)
  let itemBuffer: string | null = null;

  const push = ({ text }: { text: string }) => {
    const items: unknown[] = [];

    for (const char of text) {
      if (isFinished) break;

      if (isInString) {
        if (itemBuffer !== null) itemBuffer += char;

        if (isEscaped) {
          isEscaped = false;
        } else if (char === "\\") {
          isEscaped = true;
        } else if (char === '"') {
          isInString = false;
        }

        continue;
      }

      if (char === '"') {
        isInString = true;

        if (itemBuffer !== null) itemBuffer += char;

        continue;
      }

      if (char === "{" || char === "[") {
        if (depth === 0) isTopLevelArray = char === "[";

        depth += 1;

        if (depth === 2 && char === "{" && isTopLevelArray) {
          itemBuffer = "{";
        } else if (itemBuffer !== null) {
          itemBuffer += char;
        }

        continue;
      }

      if (char === "}" || char === "]") {
        if (itemBuffer !== null) itemBuffer += char;

        depth -= 1;

        // 원소 객체가 닫힘
        if (depth === 1 && itemBuffer !== null) {
          if (char === "}") {
            try {
              items.push(JSON.parse(itemBuffer));
            } catch {
              // 깨진 원소는 진행 표시에서만 빠진다. 최종 검증이 따로 거부한다
            }
          }

          itemBuffer = null;
        }

        if (depth <= 0) isFinished = true;

        continue;
      }

      // 원소 사이의 공백·쉼표는 버리고, 원소 안의 문자만 모은다
      if (itemBuffer !== null) itemBuffer += char;
    }

    return { items };
  };

  return { push };
}
