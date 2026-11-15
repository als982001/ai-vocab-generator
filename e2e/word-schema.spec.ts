// 브라우저 없이 도는 순수 함수 테스트. 화면 fixture(mocks)가 필요 없어 support/test가 아닌 기본 test를 쓴다
import { expect, test } from "@playwright/test";

import {
  CEFR_LEVELS,
  JLPT_LEVELS,
  PARTS_OF_SPEECH,
  buildWordResponseSchema,
} from "../shared/constants/wordSchema";

interface ISchemaItems {
  type: string;
  properties: Record<string, { enum?: string[] }>;
  required: string[];
  additionalProperties: boolean;
}

const BASE_FIELDS = ["word", "reading", "meaning", "level", "box_2d"];

const CASES = [
  {
    language: "ja",
    fileType: "image",
    fields: BASE_FIELDS,
    levels: JLPT_LEVELS,
  },
  {
    language: "ja",
    fileType: "pdf",
    fields: [...BASE_FIELDS, "page"],
    levels: JLPT_LEVELS,
  },
  {
    language: "en",
    fileType: "image",
    fields: [...BASE_FIELDS, "part_of_speech"],
    levels: CEFR_LEVELS,
  },
  {
    language: "en",
    fileType: "pdf",
    fields: [...BASE_FIELDS, "part_of_speech", "page"],
    levels: CEFR_LEVELS,
  },
] as const;

for (const { language, fileType, fields, levels } of CASES) {
  test(`응답 스키마: ${language} × ${fileType}`, () => {
    const { schema } = buildWordResponseSchema({ language, fileType });
    const items = schema.items as ISchemaItems;

    expect(schema.type).toBe("array");

    // 언어·파일 종류별 필드 구성: 일본어엔 품사 없음, PDF에만 page
    expect(Object.keys(items.properties).sort()).toEqual([...fields].sort());

    // 모델 스키마는 엄격: 전 필드 필수 + 정의 밖 필드 금지
    expect([...items.required].sort()).toEqual([...fields].sort());
    expect(items.additionalProperties).toBe(false);

    // 등급은 언어별 enum만 허용 (null 없음: 등급 미정은 런타임 normalizeWords가 결정)
    expect(items.properties.level.enum).toEqual([...levels]);

    if (language === "en") {
      expect(items.properties.part_of_speech.enum).toEqual([
        ...PARTS_OF_SPEECH,
      ]);
    }
  });
}

test("응답 스키마: box_2d는 0~1000 정수 4개, page는 1 이상 정수", () => {
  const { schema } = buildWordResponseSchema({
    language: "en",
    fileType: "pdf",
  });
  const { properties } = schema.items as {
    properties: Record<string, unknown>;
  };

  expect(properties.box_2d).toEqual({
    type: "array",
    items: { type: "integer", minimum: 0, maximum: 1000 },
    minItems: 4,
    maxItems: 4,
  });
  expect(properties.page).toEqual({ type: "integer", minimum: 1 });
});
