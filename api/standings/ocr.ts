// @ts-nocheck
import type { VercelRequest, VercelResponse } from '@vercel/node'
import OpenAI from 'openai'

const REQUIRED_FIELDS = ['position', 'driver', 'team'] as const

const schemaDefinition = {
  type: 'object',
  properties: {
    entries: {
      type: 'array',
      description: 'Detected standings rows ordered by finishing/qualifying position',
      items: {
        type: 'object',
        properties: {
          position: { type: ['integer', 'null'] },
          driver: { type: ['string', 'null'] },
          team: { type: ['string', 'null'] },
          tyre: { type: ['string', 'null'] },
          tyreCompound: { type: ['string', 'null'] },
          lapTime: { type: ['string', 'null'] },
          gap: { type: ['string', 'null'] },
          startingPosition: { type: ['integer', 'null'] },
          pitStopCount: { type: ['integer', 'null'] },
          bestLap: { type: ['string', 'null'] },
          finishTime: { type: ['string', 'null'] },
          points: { type: ['integer', 'null'] }
        },
        required: ['position', 'driver', 'team'],
        additionalProperties: false
      }
    },
    warnings: {
      type: 'array',
      description: 'Potential data quality concerns',
      items: { type: 'string' }
    }
  },
  required: ['entries'],
  additionalProperties: false
}

const buildPrompt = (sessionType: string) => {
  const shared =
    'Extract the full table of F1 game results from the screenshot. Return clean text without abbreviations unless the screenshot uses them. Use null for missing values.'

  if (sessionType === 'race') {
    return `${shared} Focus on finishing position, driver, team, grid/start position, pit stop count, best lap, total race time (or status), and points.`
  }

  return `${shared} Focus on qualifying position, driver, team, tyre info, fastest lap time, and gap to the leader.`
}

const handler = async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method Not Allowed' })
    return
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    res.status(500).json({ success: false, message: 'OPENAI_API_KEY nincs beállítva.' })
    return
  }

  const { image, sessionType } = req.body ?? {}

  if (!image || typeof image !== 'string') {
    res.status(400).json({ success: false, message: 'Hiányzó kép adat.' })
    return
  }

  if (!sessionType || !['qualifying', 'race'].includes(sessionType)) {
    res.status(400).json({ success: false, message: 'Érvénytelen session típus.' })
    return
  }

  try {
    const client = new OpenAI({ apiKey })
    const response = await client.responses.create({
      model: 'gpt-4o-mini',
      input: [
        {
          role: 'system',
          content: [
            {
              type: 'input_text',
              text: `You are an assistant that extracts structured racing standings from screenshots. Always follow the JSON schema. Ensure numeric fields stay numeric. Required base fields: ${REQUIRED_FIELDS.join(
                ', '
              )}.`
            }
          ]
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: buildPrompt(sessionType)
            },
            {
              type: 'input_image',
              image_url: image
            }
          ]
        }
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'StandingsExtraction',
          schema: schemaDefinition
        }
      }
    })

    const output = response.output?.[0]
    if (!output || output.type !== 'output_text' || !output.text) {
      throw new Error('Nem sikerült értelmezni a Vision választ.')
    }

    let parsed
    try {
      parsed = JSON.parse(output.text)
    } catch (err) {
      throw new Error('AI válasz nem JSON formátumú.')
    }

    const entries = Array.isArray(parsed.entries) ? parsed.entries : []
    const sanitizedEntries = entries
      .map((entry: any) => ({
        position: entry.position ?? null,
        driver: entry.driver?.trim() || null,
        team: entry.team?.trim() || null,
        tyre: entry.tyre?.trim() || null,
        tyreCompound: entry.tyreCompound?.trim() || null,
        lapTime: entry.lapTime?.trim() || null,
        gap: entry.gap?.trim() || null,
        startingPosition: entry.startingPosition ?? null,
        pitStopCount: entry.pitStopCount ?? null,
        bestLap: entry.bestLap?.trim() || null,
        finishTime: entry.finishTime?.trim() || null,
        points: entry.points ?? null
      }))
      .filter((entry: any) => REQUIRED_FIELDS.every((field) => entry[field] !== null))

    res.status(200).json({
      success: true,
      entries: sanitizedEntries,
      warnings: parsed.warnings ?? []
    })
  } catch (err: any) {
    console.error('Screenshot OCR feldolgozás hiba:', err)
    res.status(500).json({
      success: false,
      message: err?.message ?? 'Nem sikerült feldolgozni a képet.'
    })
  }
}

export default handler


