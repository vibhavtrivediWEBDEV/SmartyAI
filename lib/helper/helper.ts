// src/automation/resolveSequence.ts
import automationJson from '../../data/dekstop.json'
import capabilityManager from '../capabilityManager';


// type Params = Record<string, string | number>

// export function resolveSequence(
//     key: string,
//     params: Params = {}
// ) {
//     const rawSequence = automationJson[key]

//     if (!rawSequence) {
//         throw new Error(`Automation key not found: ${key}`)
//     }

//     return rawSequence.map((step: any) => {
//         const resolvedStep = JSON.parse(JSON.stringify(step))

//         // 🔁 replace {{param}} everywhere
//         const replaceVars = (val: any) => {
//             if (typeof val !== 'string') return val

//             Object.keys(params).forEach(p => {
//                 val = val.replace(
//                     new RegExp(`{{${p}}}`, 'g'),
//                     String(params[p])
//                 )
//             })
//             return val
//         }

//         if (resolvedStep.target) {
//             resolvedStep.target = replaceVars(resolvedStep.target)
//         }

//         if (resolvedStep.params) {
//             Object.keys(resolvedStep.params).forEach(k => {
//                 resolvedStep.params[k] = replaceVars(resolvedStep.params[k])
//             })
//         }

//         // 🔥 AUTO FIX: type → setValue if value present
//         if (
//             resolvedStep.action === 'type' &&
//             resolvedStep.params?.value !== undefined
//         ) {
//             resolvedStep.action = 'setValue'
//         }

//         return resolvedStep
//     })
// }






type Params = Record<string, string | number>;

// App name mapping
const APP_NAME_MAP: Record<string, string> = {
    'terminal': 'Terminal',
    'settings': 'Settings',
    'safari': 'Safari',
    'vscode': 'vscode',
    'chrome': 'chrome',
    'music': 'Music',
    'spotify': 'Spotify',
    'calendar': 'Calendar',
    'maps': 'Maps',
    'youtube': 'Youtube',
    'excel': 'Excel Editor',
    'mail': 'Mail',
    'notes': 'Notes',
    'messages': 'Messages',
    'whatsapp': 'Messages',
    'telegram': 'Telegram',
    'pdf': 'PDF Viewer',
    'finder': 'Finder',
    'photos': 'Photos',
    'tv': 'TV',
    'game': 'game',
    'website': 'website',
    'projects': 'Projects',
    'resume': 'Resume PDF',
    'appstore': 'App Store',
};

export function resolveSequence(key: string, params: Params = {}): any[] {
    // 🔥 SPECIAL CASE: finder.searchWithPermission uses FileSearchOrchestrator
    // OpenClaw-style sequential permission queue
    if (key === 'finder.searchWithPermission') {
        console.log('🎯 [resolveSequence] Intercepting finder.searchWithPermission for FileSearchOrchestrator');
        console.log('   Filename:', params.filename || 'unknown');
        console.log('   Search locations:', params.searchLocations);
        
        // Return special sequence with orchestrator metadata
        const sequence = [
            {
                action: 'orchestrated-search',
                target: 'Finder',
                params: {
                    filename: params.filename,
                    searchLocations: params.searchLocations || ['Desktop', 'Documents', 'Downloads'],
                    useOrchestrator: true
                },
                delay: 0,
                _orchestrator: 'fileSearchOrchestrator'
            }
        ];
        
        // Attach capability metadata
        (sequence as any)._requiredCapabilities = ['filesystem.read'];
        (sequence as any)._permissionStatus = 'missing';
        (sequence as any)._missingCapabilities = ['filesystem.read'];
        
        return sequence;
    }
    
    // 🔥 CHECK: Is it a dynamic pattern like "terminal.open"?
    const parts = key.split('.');

    if (parts.length === 2) {
        const [appKey, action] = parts;
        const appName = APP_NAME_MAP[appKey.toLowerCase()];

        // Check if it's a basic action (open, close, maximize, minimize, focus)
        const basicActions = ['open', 'close', 'maximize', 'minimize', 'focus'];

        if (appName && basicActions.includes(action)) {
            // 🚀 DYNAMICALLY GENERATE SEQUENCE
            return generateBasicSequence(action, appName);
        }
    }

    // 🔹 Otherwise, look up in JSON
    const rawSequence = automationJson[key];

    if (!rawSequence) {
        throw new Error(`Automation key not found: ${key}`);
    }
    
    console.log(`[resolveSequence] 📋 Found automation for "${key}"`);

    // 🔥 EXTRACT META: Get estimatedDuration if present
    let estimatedDuration = 30000; // Default 30 seconds
    const lastStep = rawSequence[rawSequence.length - 1];
    
    if (lastStep && lastStep._meta && lastStep._meta.estimatedDuration) {
        estimatedDuration = lastStep._meta.estimatedDuration;
        console.log(`⏱️ [resolveSequence] Automation "${key}" estimated duration: ${estimatedDuration}ms`);
    }

    // 🔹 Resolve all {{variables}}
    const resolvedSequence = rawSequence.map((step: any) => {
        const resolvedStep = JSON.parse(JSON.stringify(step));

        // Skip _meta steps (they're just metadata)
        if (resolvedStep._meta) {
            return null;
        }
        
        // Replace {{variables}}
        const replaceVars = (val: any) => {
            if (typeof val !== 'string') return val;

            Object.keys(params).forEach(p => {
                val = val.replace(new RegExp(`{{${p}}}`, 'g'), String(params[p]));
            });
            return val;
        };

        if (resolvedStep.target) {
            resolvedStep.target = replaceVars(resolvedStep.target);
        }

        if (resolvedStep.params) {
            Object.keys(resolvedStep.params).forEach(k => {
                resolvedStep.params[k] = replaceVars(resolvedStep.params[k]);
            });
        }

        // Auto fix: type → setValue if value present
        if (resolvedStep.action === 'type' && resolvedStep.params?.value !== undefined) {
            resolvedStep.action = 'setValue';
        }

        return resolvedStep;
    }).filter(step => step !== null); // Remove null steps (_meta)

    // 🔥 ATTACH TIMEOUT to sequence (for downstream processing)
    (resolvedSequence as any)._timeout = estimatedDuration;

    // 🔹 Attach capability metadata so callers that use resolveSequence() directly
    // can know what capabilities are required and whether any are missing.
    try {
        const required = capabilityManager.inferCapabilitiesForIntent
            ? capabilityManager.inferCapabilitiesForIntent(key, params)
            : [];
        const check = capabilityManager.checkCapabilities(required);
        (resolvedSequence as any)._requiredCapabilities = required;
        (resolvedSequence as any)._permissionStatus = check.granted ? 'granted' : 'missing';
        (resolvedSequence as any)._missingCapabilities = check.missing;
    } catch (e) {
        // No-op on metadata attach failures
        console.warn('[resolveSequence] capability metadata attach failed', e);
    }
    
    return resolvedSequence;
}

// 🚀 Generate basic action sequences dynamically
function generateBasicSequence(action: string, appName: string) {
    const sequences = {
        open: [
            { action: 'open', target: appName, delay: 500 }
        ],
        close: [
            { action: 'close', target: appName, delay: 300 }
        ],
        maximize: [
            { action: 'maximize', target: appName, delay: 300 }
        ],
        minimize: [
            { action: 'minimize', target: appName, delay: 300 }
        ],
        focus: [
            { action: 'focus', target: appName, delay: 300 }
        ]
    };

    return sequences[action as keyof typeof sequences] || [];
}