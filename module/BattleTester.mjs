import pokeapi from "./helpers/pokeapi.mjs";

export default async function BattleTester(pokemonOne, pokemonTwo, moveOne, moveTwo, method = 0, iterations = 10) {
    const _apiRed = await pokeapi.pokemon(pokemonOne);
    const _apiBlue = await pokeapi.pokemon(pokemonTwo);

    const _apiMoveRed = await pokeapi.move(moveOne);
    const _apiMoveBlue = await pokeapi.move(moveTwo);

    const _red = {
        name: _apiRed.name,
        base_stats: {},
        stats: {},
        types: [],
        move: {}
    };
    const _blue = {
        name: _apiBlue.name,
        base_stats: {},
        stats: {},
        types: [],
        move: {}
    };

    // get game stats
    for (let a = 0; a < _apiRed.stats.length; a++) {
        let key = _apiRed.stats[a].stat.name;
        _red.base_stats[key] = _apiRed.stats[a].base_stat;
        _red.stats[key] = Math.round(_red.base_stats[key] / 10);

        _blue.base_stats[key] = _apiBlue.stats[a].base_stat;
        _blue.stats[key] = Math.round(_blue.base_stats[key] / 10);
    }

    // get typing
    for (const t of _apiRed.types) _red.types.push(t.type.name);
    for (const t of _apiBlue.types) _blue.types.push(t.type.name);

    // adjust their hp
    _red.stats.hp = _red.stats.hp * 6;
    _blue.stats.hp = _blue.stats.hp * 6;

    // create useable move data
    const prepareMove = (move) => {

        let p = move.power / 10;
        let d = [];

        while (p > 0) {
            if (p / 12 >= 1) {
                d.push('2d12');
                p = p % 12;
            } else if (p / 10 >= 1) {
                d.push('2d10');
                p = p % 10;
            } else if (p / 8 >= 1) {
                d.push('2d8');
                p = p % 8;
            } else if (p / 6 >= 1) {
                d.push('2d6');
                p = p % 6;
            } else if (p / 4 >= 1) {
                d.push('2d4');
                p = p % 4;
            } else {
                d.push('1d4');
                p = 0;
            }
        }

        let f = '';
        let _first = true;
        for (let a = 0; a < d.length; a++) {
            if (!_first) f += '+';
            f += d[a];
        }

        return {
            name: move.name,
            power: f,
            type: move.type.name,
            class: move.damage_class.name,
            api: move
        }
    }

    _red.move = prepareMove(_apiMoveRed);
    _blue.move = prepareMove(_apiMoveBlue);

    // Simulate the combats
    const LogTemplate = () => {
        return {
            accuracy: 100,
            damage_dealt: 0,
            damage_taken: 0,
            dpr: 0,
            attacks: 0,
            hits: 0,
            misses: 0,
            crits: 0
        }
    }

    const logs = [];

    for (let loop = 0; loop < iterations; loop += 1) {
        const logData = {
            turns: 0,
            winner: undefined,
            [_red.name]: LogTemplate(),
            [_blue.name]: LogTemplate(),
            timeline: []
        }

        const _cRed = JSON.parse(JSON.stringify(_red));
        const _cBlue = JSON.parse(JSON.stringify(_blue));

        // pokemon combat function to call
        const PokemonAttack = async (attacker, defender) => {
            logData.timeline.push(`${attacker.name} attacked ${defender.name} using ${attacker.move.name}`)
            // generate attack data we need
            const formula = {
                damage: `${attacker.move.power} + ${Math.floor(attacker.stats.attack / 2)}`,
                attack: `1d20 + ${Math.floor(attacker.stats.attack / 2)}`
            }

            const key = {
                attack: (attacker.move.class == 'physical' ? 'attack' : 'special-attack'),
                defense: (attacker.move.class == 'physical' ? 'defense' : 'special-defense'),
            }

            const effectiveness = pta.utils.typeEffectiveness(attacker.move.type, defender.types)

            switch (method) {
                case 0:
                    // dice added version
                    //if (effectiveness.value > 0) formula.damage += ` + ${effectiveness.value}${dice_size}`;
                    //if (effectiveness.value < 0) formula.damage += ` - ${effectiveness.value}${dice_size}`;
                    // dice multipliers
                    if (effectiveness.value > 0) formula.damage = `(${formula.damage}) * ${effectiveness.value * 2}`;
                    if (effectiveness.value < 0) formula.damage = `(${formula.damage}) * ${1 / (effectiveness.value * -2)}`;
                    for (const t of attacker.types) if (t == attacker.move.type) formula.damage += ' + 4';
                    break;
            }

            // get the roll values before hand for ease of use
            const _roll = {
                damage: undefined,
                accuracy: undefined,
                attack: undefined
            }

            const dmg = new Roll(formula.damage);
            await dmg.evaluate();

            const acc = new Roll('1d100');
            await acc.evaluate();

            const rAtk = new Roll(formula.attack);
            await rAtk.evaluate();

            // change the combat method were testing
            if (method == 0) { // default system
                // roll the attack
                _roll.attack = new Roll('1d20');
                _roll.attack.evaluate();

                // check for natural crit
                let critical = false;
                if (_roll.attack.total == 20) {
                    critical = true;
                    formula.damage = `${Math.floor(attacker.move.api.power / 20 * 12)} + ${attacker.stats[key.attack]}`;
                }

                // Attack data log
                logData.timeline.push(`Attack roll: ${formula.attack} = ${rAtk.total}`);
                logData[attacker.name].attacks += 1;
                if (critical) {
                    logData.timeline.push(`It's a critical hit!`);
                    logData[attacker.name].crits += 1;
                }

                if (rAtk.total >= defender.stats[key.defense]) {
                    // Logs that the attack hit
                    logData.timeline.push(`${attacker.name} hit ${defender.name} with ${attacker.move.name} for ${dmg.total} damage`);
                    logData.timeline.push(`Damage roll: ${formula.damage} = ${dmg.total}`);
                    logData[attacker.name].hits += 1;
                    logData[attacker.name].damage_dealt += dmg.total;
                    logData[defender.name].damage_taken += dmg.total;

                    // calculates damage dealt
                    const finalDamage = dmg.total
                    defender.stats.hp -= finalDamage;

                } else {
                    logData.timeline.push(`${attacker.name} missed with ${key.attack} ${rAtk.total} against ${key.defense} ${defender.stats[key.defense]}`)
                    logData[attacker.name].misses += 1;
                }
            } else if (method == 1) { // DND5e method

            } else if (method == 2) { // Rolled defence

            } else if (method == 3) { // callums nonsense
                // Uses game accuracy

            }
        }

        let _cTimer = 0;
        let _cDuration = 30;
        while (_cRed.stats.hp > 0 && _cBlue.stats.hp > 0) {
            if (_cTimer > _cDuration) {
                logData.timeline.push('SIMULATION LENGTH EXCEEDED MAX');
                break; // ends the combat if it takes more than this many turns
            }
            _cTimer += 1;
            logData.timeline.push(`---------------------------------- TURN ${_cTimer} ----------------------------------`);

            if (_cRed.stats.speed >= _cBlue.stats.speed) {
                await PokemonAttack(_cRed, _cBlue);// red goes first
                if (_cBlue.stats.hp <= 0) continue;

                await PokemonAttack(_cBlue, _cRed);
            } else {
                await PokemonAttack(_cBlue, _cRed);// blue goes first
                if (_cRed.stats.hp <= 0) continue;
                await PokemonAttack(_cRed, _cBlue);
            }
        }

        if (_cTimer > _cDuration) {

        } else {
            logData.winner = (_cRed.stats.hp > 0 ? _cRed.name : _cBlue.name);
            logData.turns = _cTimer;
            // pokemons accuracy
            logData[_red.name].accuracy = Math.max(logData[_red.name].hits / logData[_red.name].attacks * 100, 0);
            logData[_blue.name].accuracy = Math.max(logData[_blue.name].hits / logData[_blue.name].attacks * 100, 0);
            // pokemons damage per round
            logData[_red.name].dpr = Math.max(logData[_red.name].damage_dealt / logData[_red.name].attacks, 0);
            logData[_blue.name].dpr = Math.max(logData[_blue.name].damage_dealt / logData[_blue.name].attacks, 0);

            // fix NaN results from dividing by 0
            for (const key of Object.keys(logData[_red.name])) {
                if (Number.isNaN(logData[_red.name][key])) logData[_red.name][key] = 0;
                if (Number.isNaN(logData[_blue.name][key])) logData[_blue.name][key] = 0;
            }
        }

        logs.push(logData);
    }

    const summary = {
        teamRed: {
            wins: 0,
            lost: 0,
            pokemon: _red,
            move: _red.move,
            accuracy: 0,
            dpr: 0,
        },
        teamBlue: {
            wins: 0,
            lost: 0,
            pokemon: _blue,
            move: _blue.move,
            accuracy: 0,
            dpr: 0,
        },
        winner: 'noone',
        longest: logs[0],
        duration: 0,
        median: {}
    };

    let samples = logs.length;
    for (const l of logs) {
        summary.duration += l.turns;
        if (l.winner == _red.name) {
            summary.teamRed.wins += 1;
            summary.teamBlue.lost += 1;
        }
        if (l.winner == _blue.name) {
            summary.teamBlue.wins += 1;
            summary.teamRed.lost += 1;
        }

        if (l.turns > summary.longest.turns) summary.longest = l;

        summary.teamRed.accuracy += l[_red.name].accuracy;
        summary.teamRed.dpr += l[_red.name].dpr;

        summary.teamBlue.accuracy += l[_blue.name].accuracy;
        summary.teamBlue.dpr += l[_blue.name].dpr;

        if (Object.hasOwn(summary.median, l.turns)) summary.median[l.turns] += 1;
        else summary.median[l.turns] = 1;
    }

    summary.duration /= samples;

    summary.teamRed.dpr /= samples;
    summary.teamRed.accuracy /= samples;

    summary.teamBlue.dpr /= samples;
    summary.teamBlue.accuracy /= samples;

    summary.logs = logs;
    if (summary.teamRed.wins > summary.teamBlue.wins) summary.winner = _red.name;
    if (summary.teamRed.wins < summary.teamBlue.wins) summary.winner = _blue.name;
    if (summary.teamRed.wins == summary.teamBlue.wins) summary.winner = 'DRAW!';

    console.log('Summary: ', summary);
}