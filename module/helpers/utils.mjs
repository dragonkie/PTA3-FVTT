export default {
    /*--------------------------------------------------------------*/
    /*                         LOCALIZATION                         */
    /*--------------------------------------------------------------*/
    localize(str) { return game.i18n.localize(str); },
    format(str, data) { return game.i18n.format(str, data); },
    honourLevel(num) {
        num += 1;
        let level = 1;
        let cost = 1;
        let count = 0;
        while (num > cost) {
            num -= cost;
            level += 1;
            count += 1;
            if (count >= 3) {
                count = 0;
                cost = Math.min(cost + 1, 5);
            }
        }
        return level;
    },

    toTitleCase(str) {
        return str.replace(
            /\w\S*/g,
            text => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
        );
    },

    randomNature(options = {}) {
        let _options = {
            use: [],
            ban: [],
            neutral: true
        };
        // if only a boolean was passed, use it to decide neutrals
        if (typeof options == "boolean") options = { neutral: options }
        options = Object.assign(_options, options);

        // create a roster of valid natures to use
        let choices = [];
        if (options.use.length > 0) choices = options.use;
        else if (options.neutral) choices = Object.keys(pta.config.natures);
        else {
            choices = Object.keys(pta.config.natures);
            for (const i of Object.keys(pta.config.natureNeutral)) options.ban.push(i);
        }

        // check if neutral natures ahve been turned on
        if (!game.settings.get('pta3', 'neutralNatures')) {
            for (const a in pta.config.natureNeutral) options.ban.push(a);
        }

        for (const i of options.ban) {
            let index = 0;
            while (index > -1) {
                index = choices.indexOf(i);
                if (index < 0) break;
                choices.splice(index, 1);
            }
        }

        return choices[Math.floor(Math.random() * choices.length)];
    },

    /**
     * Converts the effectiveness level
     * @param {Array|String} attacker
     * @param {Array|String} defender 
     */
    typeEffectiveness(attacker = [], defender = []) {
        if (!attacker || !defender) return null;
        if (!Array.isArray(attacker)) attacker = [attacker];
        if (!Array.isArray(defender)) defender = [defender];

        let data = {
            value: 0,
            immune: false,
        }
        
        for (const a of attacker) {
            if (typeof a != 'string' || a == '') continue;
            for (const d of defender) {
                if (typeof d != 'string' || d == '') continue;
                if (pta.config.typeEffectiveness[d].double.includes(a)) data.value += 1;
                if (pta.config.typeEffectiveness[d].half.includes(a)) data.value -= 1;
                if (pta.config.typeEffectiveness[d].immune.includes(a)) data.immune = true;
            }
        }
        return data;
    },

    /**
     * Calculates the damage dealt based on type effectiveness
     * @param {Number} num 
     * @param {String} type 
     */
    damageCalc(num, type) {

    },
    lerp(x, y, t) {
        return x * (1 - t) + y * t;
    },
    lerpPoint(x1, y1, x2, y2, t) {
        return {
            x: this.lerp(x1, x2, t),
            y: this.lerp(y1, y2, t)
        }
    },
    fastBezier(x1, y1, x2, y2, t) {
        const x3 = x1;
        const y3 = y2;

        const a = {
            x: this.lerp(x1, x3, t),
            y: this.lerp(y1, y3, t)
        }

        const b = {
            x: this.lerp(x3, x2, t),
            y: this.lerp(y3, y2, t)
        }

        return { x: this.lerp(a.x, b.x, t), y: this.lerp(a.y, b.y, t) };
    },
    quadraticBezier(x1, y1, x2, y2, x3, y3, t) {

    }
}