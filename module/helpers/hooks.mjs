export default function registerHooks() {
    Hooks.on('preCreate', async (...args) => {
        console.log('PRE_CREATE_HOOK', args);
    })
}