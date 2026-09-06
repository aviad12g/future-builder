import { env } from 'cloudflare:workers';
import { ApiError, fail, json, runtime, sameOrigin, user } from '@/lib/server';
import { parseSatExtraction } from '@/lib/sat-extraction';

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const allowedTypes = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
]);

function base64(bytes: Uint8Array) {
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 32768)
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 32768));
  return btoa(binary);
}

function b64url(bytes: Uint8Array) {
  return base64(bytes)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

async function ownerPrefix(uid: string) {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(uid),
  );
  return b64url(new Uint8Array(digest).slice(0, 18));
}

const schema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'kind',
    'questionText',
    'choices',
    'section',
    'topic',
    'difficulty',
    'sourceQuestionId',
    'imageEssential',
    'imageDescription',
  ],
  properties: {
    kind: { type: 'string', enum: ['multiple-choice', 'open-response'] },
    questionText: { type: 'string' },
    choices: {
      type: 'array',
      maxItems: 8,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['label', 'text'],
        properties: { label: { type: 'string' }, text: { type: 'string' } },
      },
    },
    section: { type: 'string', enum: ['Math', 'Reading & Writing'] },
    topic: { type: 'string' },
    difficulty: { type: 'string', enum: ['Easy', 'Medium', 'Hard', 'Unknown'] },
    sourceQuestionId: { type: 'string' },
    imageEssential: { type: 'boolean' },
    imageDescription: { type: 'string' },
  },
} as const;

export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const uid = await user();
    const apiKey = runtime('OPENAI_API_KEY');
    if (!apiKey)
      throw new ApiError(
        'Screenshot extraction needs OPENAI_API_KEY in the hosted environment.',
        503,
      );
    if (!request.headers.get('content-type')?.startsWith('multipart/form-data'))
      throw new ApiError('Choose an image to extract.');
    if (
      Number(request.headers.get('content-length') || 0) >
      MAX_IMAGE_BYTES + 100000
    )
      throw new ApiError(
        'The screenshot is too large. Use an image under 8 MB.',
        413,
      );
    const form = await request.formData();
    const file = form.get('image');
    if (!(file instanceof File))
      throw new ApiError('Choose a screenshot image.');
    if (!allowedTypes.has(file.type))
      throw new ApiError('Use a PNG, JPEG, WebP, or GIF screenshot.');
    if (!file.size || file.size > MAX_IMAGE_BYTES)
      throw new ApiError(
        'The screenshot must be between 1 byte and 8 MB.',
        413,
      );
    const bytes = new Uint8Array(await file.arrayBuffer());
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: runtime('OPENAI_VISION_MODEL') || 'gpt-5.4-mini',
        store: false,
        max_output_tokens: 1800,
        instructions:
          'Extract one SAT practice question faithfully. Preserve mathematical notation in readable plain text or LaTeX. Never invent obscured text. If a graph, table, or diagram is necessary to answer, set imageEssential true and briefly describe what is visible without replacing the image. Do not solve the question and do not infer a correct answer.',
        input: [
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: 'Extract this SAT question into the required schema.',
              },
              {
                type: 'input_image',
                image_url: `data:${file.type};base64,${base64(bytes)}`,
                detail: 'high',
              },
            ],
          },
        ],
        text: {
          format: {
            type: 'json_schema',
            name: 'sat_question_extraction',
            strict: true,
            schema,
          },
        },
      }),
      signal: AbortSignal.timeout(45000),
    });
    const payload = (await response.json()) as any;
    if (!response.ok) {
      if (response.status === 401 || response.status === 403)
        throw new ApiError(
          'Screenshot extraction credentials are invalid. Ask the site owner to check OPENAI_API_KEY.',
          503,
        );
      if (response.status === 429)
        throw new ApiError(
          'Screenshot extraction is busy or rate-limited. Try again shortly.',
          429,
        );
      throw new ApiError(
        'The screenshot could not be extracted. Try a clearer crop or enter the question manually.',
        502,
      );
    }
    const outputText =
      typeof payload.output_text === 'string'
        ? payload.output_text
        : payload.output
            ?.flatMap((item: any) => item.content || [])
            .find((item: any) => item.type === 'output_text')?.text;
    if (typeof outputText !== 'string')
      throw new ApiError(
        'The extraction result was incomplete. Try again.',
        502,
      );
    let extracted;
    try {
      extracted = parseSatExtraction(JSON.parse(outputText));
    } catch {
      throw new ApiError(
        'The extraction result was incomplete. Try a clearer crop or enter the question manually.',
        502,
      );
    }
    const bucket = (env as unknown as { SAT_IMAGES?: R2Bucket }).SAT_IMAGES;
    if (!bucket)
      throw new ApiError('Question image storage is not configured.', 503);
    const imageKey = `${await ownerPrefix(uid)}/${crypto.randomUUID()}`;
    await bucket.put(imageKey, bytes, {
      httpMetadata: { contentType: file.type },
    });
    return json({ extracted, imageKey });
  } catch (error) {
    return fail(error);
  }
}
