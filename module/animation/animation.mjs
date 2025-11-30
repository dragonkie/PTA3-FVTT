// MATH FUNCTIONS STORED IN pta.utils (lerp, curve, easing, etc...)
export default class PtaAnimationManager {
    async loadPixelSprite(url) {
        // load the asset
        const texture = await PIXI.Assets.load(url);
        const sprite = new PIXI.Sprite(texture);

        // disable filters and enable pixel scaling
        PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
        const savedFilters = canvas.app.stage.filters;
        canvas.app.stage.filters = null;

        // Add and render the new sprite
        canvas.app.stage.addChild(sprite);
        canvas.app.renderer.render(canvas.app.stage);

        // enable the filters and scaling again
        PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.LINEAR;
        canvas.app.stage.filters = savedFilters;

        return sprite;
    }

    // function to set container position based off its lerped value to destination
    moveTo(asset, _x, _y, _t = 1) {
        const xStart = asset.x;
        const yStart = asset.y;
        let lastUpdate = Date.now();
        let accumulator = 0;
        let loop = undefined;

        loop = setInterval(() => {
            let now = Date.now();
            const dt = (now - lastUpdate) / 1000;
            lastUpdate = now;
            accumulator += dt;

            let offset = pta.utils.fastBezier(xStart, yStart, _x, _y, accumulator / _t);

            asset.x = offset.x;
            asset.y = offset.y;
            if (accumulator >= 1 * _t) clearInterval(loop);
        });
    }

    // function to set container position based off its lerped value to destination
    // good for things like homing attacks, gets those cool arrow looks
    moveToCurved(asset, _x, _y, _t = 1) {
        const xStart = asset.x;
        const yStart = asset.y;
        let lastUpdate = Date.now();
        let accumulator = 0;
        let loop = undefined;

        loop = setInterval(() => {
            let now = Date.now();
            const dt = (now - lastUpdate) / 1000;
            lastUpdate = now;
            accumulator += dt;

            let offset = pta.utils.fastBezier(xStart, yStart, _x, _y, accumulator / _t);

            asset.x = offset.x;
            asset.y = offset.y;
            if (accumulator >= 1 * _t) clearInterval(loop);
        });
    }
}

