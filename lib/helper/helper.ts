// src/automation/resolveSequence.ts
import automationJson from '../../data/dekstop.json'


type Params = Record<string, string | number>

export function resolveSequence(
    key: string,
    params: Params = {}
) {
    const rawSequence = automationJson[key]

    if (!rawSequence) {
        throw new Error(`Automation key not found: ${key}`)
    }

    return rawSequence.map((step: any) => {
        const resolvedStep = JSON.parse(JSON.stringify(step))

        // 🔁 replace {{param}} everywhere
        const replaceVars = (val: any) => {
            if (typeof val !== 'string') return val

            Object.keys(params).forEach(p => {
                val = val.replace(
                    new RegExp(`{{${p}}}`, 'g'),
                    String(params[p])
                )
            })
            return val
        }

        if (resolvedStep.target) {
            resolvedStep.target = replaceVars(resolvedStep.target)
        }

        if (resolvedStep.params) {
            Object.keys(resolvedStep.params).forEach(k => {
                resolvedStep.params[k] = replaceVars(resolvedStep.params[k])
            })
        }

        // 🔥 AUTO FIX: type → setValue if value present
        if (
            resolvedStep.action === 'type' &&
            resolvedStep.params?.value !== undefined
        ) {
            resolvedStep.action = 'setValue'
        }

        return resolvedStep
    })
}
