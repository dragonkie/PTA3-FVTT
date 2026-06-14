import PtaActor from "../../documents/actor.mjs";
import { PTA } from "../../helpers/config.mjs";
import pokeapi from "../../helpers/pokeapi.mjs";
import utils from "../../helpers/utils.mjs";
import PtaApplication from "../app.mjs";

export default class MoveImporter extends PtaApplication {
    static DEFAULT_OPTIONS = {
        classes: ['importer'],
        window: {
            title: PTA.windowTitle.moveImporter,
            icon: "fa-solid fa-download",
            minimizable: false,
            resizeable: false,
        },
        position: {
            width: 600,
            height: 800
        },
        actions: {
            search: this._onSearch,
            select: this._onSelect,
            submit: this._onSubmit,
            remove: this._onRemove,
        }
    }

    move_selections = [];

    static PARTS = {
        main: { template: PTA.templates.app.importMoves }
    }

    async _prepareContext() {
        let context = super._prepareContext();
        context.id = this.id;
        return context;
    }

    actor = undefined;

    async linkActor(actor) {
        if (typeof actor == 'string') actor = await fromUuid(actor);
        if (!actor || !actor instanceof PtaActor) return false

        this.actor = actor;
        return true;
    }

    static async _onSearch(event, target) {
        utils.info('PTA.Info.LoadingPleaseWait');
        const content = this.element.querySelector('section.window-content');
        const searchInput = content.querySelector('.search-input');
        const query = searchInput.value.toLowerCase().replace(' ', '-')

        const search_list = [];
        // compile a list of valid pokemon
        for (const move of PTA.Pokedex.Moves) if (move.startsWith(query)) search_list.push(move);

        const wrapper = this.element.querySelector('.search-results');
        while (wrapper.lastChild) wrapper.removeChild(wrapper.lastChild);

        // goes through and comppiles a list of the pokemon available
        for (const move of search_list) {
            // add the pokemon to the element search results
            let ele = document.createElement('LI');
            ele.setAttribute('data-action', 'select');
            ele.setAttribute('data-move', move);
            ele.setAttribute('style', 'margin: 8px 0; font-size: 1.2em;');
            ele.innerHTML = `
                ${utils.toTitleCase(move)}
            `
            wrapper.appendChild(ele);
        }

        return void utils.info('PTA.Info.FinishedLoading');;
    }

    static async _onSelect(event, target) {
        // get the relevant data ready to use
        const selection_list = this.element.querySelector('.pta-selection-list .wrapper');
        const move_name = target.closest('[data-move]').dataset.move;

        if (this.move_selections.includes(move_name)) return;

        this.move_selections.push(move_name);// add result to selections

        // add an element to the selection list so theu can be tracked / removed
        let ele = document.createElement('DIV');
        ele.setAttribute('data-move', move_name);
        ele.setAttribute('style', 'flex: 0');
        selection_list.appendChild(ele);
        ele.innerHTML = `
            <a class="content-link flexrow nowrap" data-action="remove">${move_name} <i class="fas fa-trash"></i></a>
        `;
    }

    static async _onRemove(event, target) {
        let element = target.closest('[data-move]');
        let move_name = element.dataset.move;
        let index = this.move_selections.findIndex((i) => i == move_name);
        this.move_selections.splice(index, 1);
        element.remove();
    }

    static async _onSubmit(event, target) {
        const create_data = [];
        utils.info('PTA.Info.SubmittingPleaseWait');
        this.close();
        for (const move of this.move_selections) {
            let data = utils.parseMoveData(await pokeapi.move(move));
            if (!data) continue;
            create_data.push({
                name: utils.toTitleCase(move.replace('-', ' ')),
                type: 'move',
                system: data,
            })
        }

        // if this importer instance was linked to an actor, moves are imported as theirs
        let create_config = {};
        if (this.actor) {
            create_config.parent = this.actor;
        }

        Item.create(create_data, create_config);
        utils.info('PTA.Info.ImportComplete');
        this.move_selections = [];
    }

    _onRender(context, options) {
        super._onRender(context, options);

        // Add event listeners for making everything work
        const content = this.element.querySelector('section.window-content');
        if (!content) return;

        const searchData = content.querySelector('form.search-data');
        const searchList = content.querySelector('datalist');
        const searchInput = content.querySelector('.search-input');

        searchData.addEventListener('submit', (event) => {
            if (event.preventDefault) event.preventDefault();
            this.options.actions.search.call(this, event, searchInput);
            return false;
        })

        // add the auto complete search results
        searchInput.addEventListener('input', (event) => {
            const query = searchInput.value.toLowerCase().replaceAll(" ", "-");
            const sorted = utils.duplicate(PTA.Pokedex.Moves).sort();
            const matches = [];

            // if theres less than 2 characters, dont bother searching
            if (query.length < 1) return;

            //Go through the sorted array to get the proper results
            for (const entry of sorted) {
                if (entry.startsWith(query)) matches.push(entry);
                if (matches.length >= 5) break;
            }

            // create new elements
            while (searchList.lastChild) searchList.removeChild(searchList.lastChild);

            for (const m of matches) {
                const e = document.createElement('option');
                e.value = m;
                searchList.appendChild(e);
            }
        });
    }

    static importAllMoves() {
        importAllMovesFromCSV();
    }
}

async function importAllMovesFromCSV() {
    const columns = 20;
    const rgxSplit = /("[^"]+"|[^,]+)*,/g;
    const typings = {
        bug: 'PTA.Type.Bug',
        dark: 'PTA.Type.Dark',
        dragon: 'PTA.Type.Dragon',
        electric: 'PTA.Type.Electric',
        fairy: 'PTA.Type.Fairy',
        fighting: 'PTA.Type.Fighting',
        fire: 'PTA.Type.Fire',
        flying: 'PTA.Type.Flying',
        ghost: 'PTA.Type.Ghost',
        grass: 'PTA.Type.Grass',
        ground: 'PTA.Type.Ground',
        ice: 'PTA.Type.Ice',
        normal: 'PTA.Type.Normal',
        poison: 'PTA.Type.Poison',
        psychic: 'PTA.Type.Psychic',
        rock: 'PTA.Type.Rock',
        steel: 'PTA.Type.Steel',
        water: 'PTA.Type.Water',
    }
    const CSV = `Name|Range|Type|Atk/Special/Effect|Frequency|Damage Die Number|Damage Die|Accuracy mod|Effect|Granted Skills|Contest Stat|Contest Keyword|Damage Dice|FreqCategory|RangeCategory|Range1|MoveKeyword|Range2|DieCountNoDash|DieSizeNoDash
(Elemental Attack)|Varies|(Variable)|Varies|Varies||||Mechanical Rotom will have an attack relat-ed to whatever machine they’ve inhabiting while using their Wired passives. It may have an Ice-type attack while inhabiting a fridge or icebox, or a Fire-type attack while inhabiting an oven or microwave.|||||-2|Varies|||||
(Extra Move)|Varies|(Variable)|Varies|Varies||||Placeholder move.|||||-2|Varies|||||
Absolutely Breathtaking|Ranged(20ft burst)|Normal|Effect|1/day||||On hit, all enemy Pokémon targets are stunned. As long as you do not move or make another attack during the next three rounds of combat, the targets remained stunned. If you are moved, the effects of Absolutely Breathtaking ends.|||||1|Ranged|20|burst|||
Absorb|Melee|Grass|Special|3/day|2|d8||On hit, you regain HP equal to half of the damage dealt.||Clever|Good Show!|2d8|3|Melee||||2|d8
Accelerock|Melee|Rock|Attack|At-Will|2|d6||Accelerock has Priority.||Cool|Quick Set|2d6|0|Melee||||2|d6
Acid Downpour|Ranged(60ft, 20ft blast)|Poison|(Variable)|1/day|8|d12||||||8d12|1|Ranged|60|blast|20|8|d12
Acid Spray|Ranged(20ft)|Poison|Special|3/day|1|d12||On hit, the target's Special Defense is -1 for 10 mins. This effect cannot be stacked.||Clever|Unsettling|1d12|3|Ranged|20|||1|d12
Acrobatics|Melee|Flying|Attack|1/day|3|d12||Acrobatics cannot be used if you have a held item.||Clever|Incentives|3d12|1|Melee||||3|d12
Acupressure|Melee|Normal|Effect|3/day||||Target an ally or yourself. The target’s Attack, Special Attack, Defense, Special Defense, or Speed is raised +2 for five mins. This effect cannot be stacked.||Cool|Get Ready!||3|Melee|||||
Aerial Ace|Melee|Flying|Attack|3/day|3|d8||You can’t miss targets with less than 15 Defense.||Cool|Round Starter|3d8|3|Melee||||3|d8
Aerial Whip|Ranged(30ft)|Flying|Special|3/day|3|d8||You can't miss targets with less than 10 Special Defense.||||3d8|3|Ranged|30|||3|d8
Aeroblast|Ranged(100ft beam)|Flying|Special|3/day|5|d20||On hit, if you got 15 or higher on Accuracy Check, Aeroblast is a critical hit.||||5d20|3|Ranged|100|beam||5|d20
After You|Ranged(20ft)|Normal|Effect|3/day||||For the rest of the encounter, your turn will be after the target’s turn.||Clever|Slow Set||3|Ranged|20||||
Air Cutter|Ranged(15ft)|Flying|Special|At-Will|2|d8|-1|Air Cutter has -1 during Accuracy Check. On hit, if you got 18 or higher on Accuracy Check, Air Cutter is a critical hit.||Cool|Appeal|2d8|0|Ranged|15|||2|d8
Air Dart|Ranged(10ft)|Flying|Attack|At-Will|2|d6||||||2d6|0|Ranged|10|||2|d6
Air Slash|Ranged(15ft)|Flying|Special|1/day|3|d12|-1|Air Slash has -1 during Accuracy Check. On hit, if you got 14 or higher on Accuracy Check, the target is Stunned.||Cool|Round Starter|3d12|1|Ranged|15|||3|d12
All-Out Pummeling|Melee(25ft burst)|Fighting|(Variable)|1/day|8|d12||Immediately move next to your target, then roll your accuracy check.||||8d12|1|Melee|25|burst||8|d12
Alluring Voice|Ranged(15ft, 5ft wave)|Fairy|Special|1/day|3|d10||On hit, if you got 17 or higher on Accuracy Check, all targets are Confused.||TODO||3d10|1|Ranged|15|wave|5|3|d10
Ally Switch|Self|Psychic|Effect|1/day||||Ally Switch is used as a Reaction. When you would be hit by an attack, use Ally Switch to instead switch places with a willing ally within 60ft. That ally is hit by the attack instead of you.||Cool|Scrambler||1|Self|||||
Alpha Beam|Ranged(25ft beam)|Normal|Special|1/day|5|d20|-2|Alpha Beam has a recharge turn and -2 during Accuracy Check.||||5d20|1|Ranged|25|beam||5|d20
Alpha Impact|Melee(10ft burst)|Normal|Attack|1/day|5|d20|-2|Alpha Impact has a recharge turn and -2 during Accuracy Check.||||5d20|1|Melee|10|burst||5|d20
Alpha Restoration|Self|Normal|Effect|3/day||||You are healed 1d12 HP. Your uses of Alpha Beam and Alpha Impact are restored as if you have rested.|||||3|Self|||||
Anchor Shot|Melee|Steel|Attack|1/day|3|d12||On hit, the target is bound to you or in place for 1d6 rounds.||Beauty|Unsettling|3d12|1|Melee||||3|d12
Ancient Power|Ranged(10ft)|Rock|Special|1/day|2|d8||On hit, your Attack, Special Attack, Defense, Special Defense, and Speed are each raised +1 for 1 hour.||Tough|Round Ender|2d8|1|Ranged|10|||2|d8
Apple Acid|Ranged(15ft)|Grass|Special|3/day|3|d10||On hit, the target's Special Defense is -1 for 10 mins. This effect cannot be stacked.||Tough|Inversed Appeal|3d10|3|Ranged|15|||3|d10
Aqua Cutter|Melee|Water|Attack|3/day|3|d10||On hit, if you got 18 or higher on Accuracy Check, Aqua Cutter is a critical hit.||Tough|Appeal|3d10|3|Melee||||3|d10
Aqua Jet|Melee|Water|Attack|At-Will|2|d6||Aqua Jet has Priority.||Beauty|Quick Set|2d6|0|Melee||||2|d6
Aqua Ring|Self|Water|Effect|1/day||||Put a Ring Coat on yourself. The Coat has the following ability: At the beginning of your turn, recover 1d10 HP. This Coat lasts for 1 min. If it’s raining, the Coat lasts for 2 mins.||Beauty|Torrential Appeal||1|Self|||||
Aqua Step|Melee|Water|Attack|3/day|3|d10||On hit, your Speed is +1 for 10 mins.||Cool|Torrential Appeal|3d10|3|Melee||||3|d10
Aqua Tail|Melee|Water|Attack|1/day|3|d12||||Cute|Appeal|3d12|1|Melee||||3|d12
Arena Trap|Ranged(5ft burst)|Ground|Effect|1/day||||On hit, all targets are bound in place for 2 mins.||TODO|||1|Ranged|5|burst|||
Arm Thrust|Melee|Fighting|Attack|At-Will|1|d4|-2|Arm Thrust has -2 during Accuracy Check. Arm Thrust is a Scatter attack. Up to 5 attacks.||Tough|Reliable|1d4|0|Melee||||1|d4
Armor Cannon|Ranged(40ft)|Fire|Special|1/day|5|d12||On hit, your Defense and Special Defense are -2 for 10 mins.||Cool|Excitement|5d12|1|Ranged|40|||5|d12
Aromatherapy|Melee|Grass|Effect|3/day||||Target an ally or yourself. Target is cured of all afflictions.|Alluring|Clever|Reflective Appeal||3|Melee|||||
Arrow Cut|Ranged(25ft)|Normal|Attack|At-Will|2|d6||||||2d6|0|Ranged|25|||2|d6
Assurance|Melee|Dark|Attack|3/day|3|d8||If the target was already attacked this round, Assurance deals +1d8 damage.||Beauty|Final Appeal|3d8|3|Melee||||3|d8
Astonish|Melee|Ghost|Attack|At-Will|1|d10||On hit, if you got 18 or higher on Accuracy Check, the target is Stunned.||Clever|Appeal|1d10|0|Melee||||1|d10
Astral Barrage|Ranged(50ft burst)|Ghost|Special|3/day|5|d20||||||5d20|3|Ranged|50|burst||5|d20
Attack Order|Ranged(10ft)|Bug|Attack|1/day|3|d12||On hit, if you got 17 or higher on Accuracy Check, Attack Order is a critical hit.||||3d12|1|Ranged|10|||3|d12
Attract|Ranged(10ft)|Normal|Effect|1/day||||On hit, the target is Infatuated with you.||Cute|Excitement||1|Ranged|10||||
Aura Sphere|Ranged(30ft)|Fighting|Special|1/day|3|d12||You can’t miss targets with less than 20 Special Defense.||Beauty|Round Starter|3d12|1|Ranged|30|||3|d12
Aura Wheel|Melee|Electric|Attack|1/day|5|d12||On hit, your Attack is +1 for 10 mins.  If you are Hangry, Aura Wheel is Dark-type.||Cute|Incredible|5d12|1|Melee||||5|d12
Aurora Beam|Ranged(15ft beam)|Ice|Special|3/day|3|d8||"On hit, all target’s Attack are -1 for 10 mins. "|Freezer|Beauty|Round Starter|3d8|3|Ranged|15|beam||3|d8
Aurora Veil|Melee|Ice|Effect|1/day||||Put a Veil Coat on the target or yourself. The Coat has the following ability: If within Hail, you only take half the damage from successful attacks. This Coat lasts for 2 mins.||Beauty|Hold That Thought||1|Melee|||||
Avalanche|Melee|Ice|Attack|3/day|3|d8||If you were attacked by the target this round, use 3d12 for damage instead||Cool|Final Appeal|3d8|3|Melee||||3|d8
Axe Kick|Melee|Fighting|Attack|3/day|3|d8||On hit, if you got 18 or higher on Accuracy Check, the target is Confused. If you miss, you lose HP equal to half of your Max HP.||Cool|Appeal|3d8|3|Melee||||3|d8
Baneful Bunker|Self|Poison|Effect|1/day||||Baneful Bunker is used as a Reaction. If you would be hit by a melee attack, use Baneful Bunker to instead ignore the damage and any effects of the attack, and also Poison the attacker.||Tough|Appeal||1|Self|||||
Barb Barrage|Ranged(15ft)|Poison|Attack|3/day|3|d8||If the target is afflicted, Barb Barrage has 5d8 for damage instead. On hit, if you got 18 or higher on Accuracy Check, the target is Poisoned.||TODO||3d8|3|Ranged|15|||3|d8
Barrage|Ranged(10ft)|Normal|Attack|At-Will|1|d4|-2|Barrage has -2 during Accuracy Check. Barrage is a Scatter attack. Up to 5 attacks.||Tough|Reliable|1d4|0|Ranged|10|||1|d4
Bash|Melee|Normal|Attack|3/day|3|d10|-2|Bash has -2 during Accuracy Check. Your energy shield shatters and may not be used for 1 min.||||3d10|3|Melee||||3|d10
Beak Blast|Melee|Flying|Attack|1/day|5|d12||Beak Blast is a two-turn move. On the first turn: any character who hits with you a melee move until your next turn is Burned. On the second turn, move up to twice your movement speed, then you may roll Beak Blast’s Accuracy Check and damage.||Tough|Special Attention|5d12|1|Melee||||5|d12
Behemoth Bash|Ranged(20ft)|Steel|Attack|3/day|3|d10||If the target is Dynamax, Gigantamax, or Eternamax, Behemoth Bash deals +250 damage.||||3d10|3|Ranged|20|||3|d10
Behemoth Blade|" Ranged(20ft)"|Steel|Attack|3/day|3|d10||" If the target is Dynamax, Gigantamax, or Eternamax, Behemoth Blade deals +250 damage."||||3d10|3|" Ranged"|20|||3|d10
Belch|Ranged(15ft)|Poison|Special|1/day|5|d12||Belch cannot be used unless you’ve eaten within the last minute.||Tough|Appeal|5d12|1|Ranged|15|||5|d12
Belly Drum|Self|Normal|Effect|3/day||||You lose HP equal to half of your Max HP, then your Attack is +6 for 10 mins. This effect cannot be stacked.||Cute|Get Ready!||3|Self|||||
Bide|Ranged(25ft burst)|Normal|Effect|1/day||||"Bide is a three-turn move. On the first and second turns, do noth- ing. On the third turn, release energy; all characters with-in range take damage equal to twice the damage you took since the first turn of Bide. "||Tough|Final Appeal||1|Ranged|25|burst|||
Bind|Melee|Normal|Attack|At-Will|1|d4||On hit, the target is bound to you for 1d4 rounds. For each round the target is bound, it takes 1d4 physical damage on its turns.||Tough|Torrential Appeal|1d4|0|Melee||||1|d4
Bite|Melee|Dark|Attack|At-Will|2|d8||On hit, if you got 18 or higher on Accuracy Check, the target is Stunned.||Tough|Appeal|2d8|0|Melee||||2|d8
Bitter Blade|Melee|Fire|Attack|1/day|3|d12||On hit, you regain HP equal to half of the damage dealt.||Cool|Good Show!|3d12|1|Melee||||3|d12
Bitter Malice|Melee|Ghost|Special|3/day|3|d10||On hit, if you got 18 or higher on Accuracy Check, the target is Frozen.||Tough|Incentives|3d10|3|Melee||||3|d10
Black Hole Eclipse|Ranged(60ft, 20ft blast)|Dark|(Variable)|1/day|8|d12||||||8d12|1|Ranged|60|blast|20|8|d12
Blast Burn|Ranged(30ft, 10ft blast)|Fire|Special|1/day|5|d20|-2|Blast Burn has a recharge turn and -2 during Accuracy Check.|Firestarter|Beauty|Seen Nothing Yet|5d20|1|Ranged|30|blast|10|5|d20
Blaze Kick|Melee|Fire|Attack|1/day|3|d12||On hit, if you got 16 or higher on Accuracy Check, the target is Burned.|Firestarter|Beauty|Round Starter|3d12|1|Melee||||3|d12
Blizzard|Ranged(20ft, 10ft wave)|Ice|Special|1/day|5|d12|-2|Blizzard has -2 during Accuracy Check unless it’s Hailing. On hit, if you got 18 or higher on Accuracy Check, the targets are Frozen.|Freezer|Beauty|Round Starter|5d12|1|Ranged|20|wave|10|5|d12
Block|Melee|Normal|Effect|3/day||||On hit, the target is bound to you for 1d6 rounds.||Cute|Hold That Thought||3|Melee|||||
Bloom Doom|Ranged(60ft, 20ft blast)|Grass|(Variable)|1/day|8|d12||||||8d12|1|Ranged|60|blast|20|8|d12
Blue Flare|Ranged(50ft)|Fire|Special|3/day|5|d12||On hit, if you got 14 or higher on Accuracy Check, the target is Burned.||||5d12|3|Ranged|50|||5|d12
Blood Moon|Ranged(5ft burst)|Normal|Special|1/day|5|d12||||TODO||5d12|1|Ranged|5|burst||5|d12
Body Press|Melee|Fighting|Attack|3/day|3|d8||Body Press deals +2 damage for every point of Defense you have above the target.||Tough|Incentives|3d8|3|Melee||||3|d8
Body Slam|Melee|Normal|Attack|1/day|3|d12||On hit, if you got 14 or higher on Accuracy Check, the target is Paralyzed.||Tough|Appeal|3d12|1|Melee||||3|d12
Bolt Beak|Melee|Electric|Attack|1/day|3|d8||If the target has not already acted this round, Bolt Beak deals +2d8 damage.||Cool|Final Appeal|3d8|1|Melee||||3|d8
Bolt Strike|Melee|Electric|Attack|3/day|5|d12||On hit, if you got 14 or higher on Accuracy Check, the target is Paralyzed.||||5d12|3|Melee||||5|d12
Bone Club|Melee|Ground|Attack|3/day|3|d8||On hit, if you got 18 or higher on Accuracy Check, the target is Stunned.||Tough|Appeal|3d8|3|Melee||||3|d8
Bone Rush|Melee|Ground|Attack|At-Will|1|d4|-2|Bone Rush has -2 during Accuracy Check. Bone Rush is a Scatter attack. Up to 5 attacks.||Tough|Reliable|1d4|0|Melee||||1|d4
Bonemerang|Ranged(15ft)|Ground|Attack|3/day|2|d8||Bonemerang is a Scatter attack. It has two attacks.||Tough|Reliable|2d8|3|Ranged|15|||2|d8
Boomburst|Ranged(25ft burst)|Normal|Special|1/day|3|d12||Anyone within range of Boomburst is cured of Sleep.||Clever|Appeal|3d12|1|Ranged|25|burst||3|d12
Bounce|Melee|Flying|Attack|1/day|3|d12||Bounce is a twoturn move. On the first turn, raise yourself 40 ft into the air. On the second turn, return to the ground, move up to twice your movement rate, then you may roll Bounce’s Accuracy Check and damage. On hit, if you got 14 or higher on Accuracy Check, the target is Paralyzed.||Cute|Special Attention|3d12|1|Melee||||3|d12
Branch Poke|Melee|Grass|Attack|At-Will|2|d6||||Cute|Appeal|2d6|0|Melee||||2|d6
Brave Bird|Melee|Flying|Attack|1/day|5|d12||On hit, you lose HP equal to 1/3rd of the damage you deal.||Cute|Round Ender|5d12|1|Melee||||5|d12
Breaking Swipe|Melee|Dragon|Attack|3/day|3|d8||"On hit, the target’s Attack is -1 for 10 mins. "||Cool|Appeal|3d8|3|Melee||||3|d8
Breakneck Blitz|Melee(25ft burst)|Normal|(Variable)|1/day|8|d12||Immediately move next to your target, then roll your accuracy check.||||8d12|1|Melee|25|burst||8|d12
Brick Break|Melee|Fighting|Attack|3/day|3|d8||Destroy any Walls within 5 ft. You may target Walls with Brick Break without needing to roll Accuracy Check or damage.||Cool|Appeal|3d8|3|Melee||||3|d8
Brine|Ranged(20ft)|Water|Special|3/day|3|d8||If the target is at less than half of their Max HP, Brine has 5d8 for damage instead||Clever|Incentives|3d8|3|Ranged|20|||3|d8
Brutal Hit|Melee|Dark|Attack|At-Will|2|d6||||||2d6|0|Melee||||2|d6
Brutal Swing|Melee(5ft burst)|Dark|Attack|At-Will|2|d8||||Tough|Excitement|2d8|0|Melee|5|burst||2|d8
Bubble|Ranged(15ft)|Water|Special|At-Will|1|d12||On hit, the target’s Speed is -1 for 10 mins. This effect cannot be stacked.||Cute|Slow Set|1d12|0|Ranged|15|||1|d12
Bubble Beam|Ranged(20ft beam)|Water|Special|3/day|3|d8||On hit, the target’s Speed is -1 for 10 mins. This effect cannot be stacked.||Beauty|Slow Set|3d8|3|Ranged|20|beam||3|d8
Bug Bite|Melee|Bug|Attack|At-Will|2|d8||On hit, if the target is holding a Berry, you steal it and immediately consume it.||Tough|Attention Grabber|2d8|0|Melee||||2|d8
Bug Buzz|Ranged(20ft)|Bug|Special|1/day|3|d12||On hit, the target’s Special Defense is -1 for 10 mins. This effect cannot be stacked.||Cute|Incentives|3d12|1|Ranged|20|||3|d12
Bulldoze|Ranged(20ft burst)|Ground|Attack|3/day|3|d8||On hit, all target’s Speed are -1 for 10 mins. This effect cannot be stacked.|Groundshaper|Cool|Appeal|3d8|3|Ranged|20|burst||3|d8
Bullet Punch|Melee|Steel|Attack|At-Will|2|d6||Bullet Punch has Priority.||Clever|Quick Set|2d6|0|Melee||||2|d6
Bullet Seed|Ranged(10ft)|Grass|Attack|At-Will|1|d4|-2|Bullet Seed has -2 during Accuracy Check. Bullet Seed is a Scatter attack. Up to 5 attacks.||Cool|Reliable|1d4|0|Ranged|10|||1|d4
Burn Up|Ranged(25ft burst)|Fire|Special|1/day|5|d12||After use, if the user is only Fire type it becomes Normal type, and if the user is Fire type and another type it loses its Fire typing. This effect lasts for 10 mins.||Beauty|Round Ender|5d12|1|Ranged|25|burst||5|d12
Burning Bulwark|Self|Fire|Effect|3/day||||" Burning Bulwark is used as a Reaction. If you would be hit by a melee attack, use Burning Bulwark to instead ignore the damage and any effects of the attack, and also Burn the attacker. If you are not in Sunny Weather, Burning Bulwark’s frequency is 1/day"|||||3|Self|||||
Burning Jealousy|Ranged(30ft, 10ft wave)|Fire|Special|1/day|2|d12||If any targets have had any stats raised in the past 2 mins, Burning Jealousy Burns the target.||Cute|Incredible|2d12|1|Ranged|30|wave|10|2|d12
Camouflage|Self|Normal|Effect|At-Will||||Your Type changes to reflect your current surroundings for one min. (If you are in a grassy field, Grass type; if you are in water, Water type; if you are on a mountain, Rock type; etc.)||Clever|Hold That Thought||0|Self|||||
Catastropika|Melee|Electric|Attack|1/day|10|d12||Immediately move next to your target, then roll your accuracy check. On hit, the target is Paralyzed.||||10d12|1|Melee||||10|d12
Ceaseless Edge|Melee|Dark|Attack|3/day|3|d8||On hit, thetarget gains a Splinters Coat unless it already has one. The coat has the following ability: After acting, roll 1d20; on a result of 16 or better, destroy this coat; otherwise, take 2d4 damage. This Coat lasts for 3 mins, or until you are at 0 or less HP.||Cool|Appeal|3d8|3|Melee||||3|d8
Celebrate|Ranged(25ft burst)|Normal|Effect|3/day||||Roll 1d20. On 20, in addition to your own stats, each ally within range has their Attack, Special Attack, Defense, Special Defense, and Speed raised +1 for 10 mins. This effect cannot be stacked.||Cute|Inversed Appeal||3|Ranged|25|burst|||
Charge|Self|Electric|Effect|At-Will||||Your next Electric attack will deal +2d8 damage. Until then, your Special Defense is +1. This effect cannot be stacked. This effect wears off after one min.|Zapper|Clever|Get Ready!||0|Self|||||
Charge Beam|Ranged(10ft beam)|Electric|Special|At-Will|1|d12||On hit, your Special Attack is +1 for 10 mins. This effect cannot be stacked.|Zapper|Beauty|Round Starter|1d12|0|Ranged|10|beam||1|d12
Charge on Through|Melee|Normal|Attack|3/day|3|d6||Charge on Through can only be made against enemies that you passed through while moving during your turn. If you were, you are no longer bound. Any Pokémon making this attack may still use a move during their turn.||||3d6|3|Melee||||3|d6
Chatter|Ranged(10ft burst)|Flying|Special|3/day|3|d8||On hit, if you got 18 or higher on Accuracy Check, all targets are Confused.||Clever|Catching Up|3d8|3|Ranged|10|burst||3|d8
Chilling Water|Ranged(30ft)|Water|Special|At-Will|2|d6||On hit, the target's Attack is -1 for 10 mins.||TODO||2d6|0|Ranged|30|||2|d6
Chip Away|Melee|Normal|Attack|3/day|3|d8||Chip Away has +2 on Accuracy Check if used against a target with a Defense or Special Defense raising passive.||Tough|Reliable|3d8|3|Melee||||3|d8
Chloroblast|Ranged(30ft burst)|Grass|Special|1/day|4|d12||You lose HP equal to half of your Max HP, then your speed is -3 for 10 mins.||Beauty|Big Show|4d12|1|Ranged|30|burst||4|d12
Chosen Metronome|Self|Normal|Effect|At-Will||||" Immediately use any attack of your choice. You cannot use the same attack this way more than once per combat. You also may not use the same elemental type of attack with Chosen Metronome two turns or actions in a row. You must use an attack, no status affecting or self-targeting moves."|||||0|Self|||||
Circle Throw|Melee|Fighting|Attack|3/day|3|d8||On hit, move the target 40ft away.||Tough|Big Show|3d8|3|Melee||||3|d8
Clamp|Melee|Water|Attack|At-Will|1|d4||On hit, the target is bound to you for 1d4 rounds. For each round the target is bound, it takes 1d4 damage on its turns.||Tough|Appeal|1d4|0|Melee||||1|d4
Clanging Scales|Ranged(10ft burst)|Dragon|Special|3/day|3|d10||On hit, the target’s Defense is -2 for 10 mins. This effect cannot be stacked.||Clever|Incentives|3d10|3|Ranged|10|burst||3|d10
Clangorous Soul|Self|Dragon|Effect|1/day||||You lose HP equal to 1/6th of your Max HP. Your Attack, Special Attack, Defense, Special Defense, and Speed are each raised +1 for 10 mins. This effect cannot be stacked.||Beauty|Incredible||1|Self|||||
Clangorous Soulblaze|Melee(40ft burst)|Dragon|Special|1/day|8|d12||Your Attack, and Special Attack are +2 for 10 mins.||||8d12|1|Melee|40|burst||8|d12
Clear Smog|Ranged(5ft burst)|Poison|Special|At-Will|1|d12||||Clever|Hold That Thought|1d12|0|Ranged|5|burst||1|d12
Clearing Smog|Ranged(20ft)|Poison|Special|At-Will|1|d12||||||1d12|0|Ranged|20|||1|d12
Close Combat|Melee|Fighting|Attack|1/day|5|d12||On hit, your Defense and Special Defense is -2 for 10 mins. This effect cannot be stacked.||Clever|Seen Nothing Yet|5d12|1|Melee||||5|d12
Coaching|Melee|Fighting|Effect|3/day||||Target ally has +2 Attack and +2 Defense for 2 mins. This effect cannot be stacked.||Cute|Good Show!||3|Melee|||||
Collision Course|Ranged(20ft burst)|Fighting|Attack|3/day|5|d12||Collision Course is a critical hit against targets that are hit while Collision Course is super effective or extremely effective.||||5d12|3|Ranged|20|burst||5|d12
Comet Punch|Melee|Normal|Attack|At-Will|1|d4|-2|Comet Punch has -2 during Accuracy Check. Comet Punch is a Scatter attack. Up to 5 attacks.||Tough|Reliable|1d4|0|Melee||||1|d4
Comeuppance|Melee|Dark|Effect|1/day||||" Comeuppance is used as a Reaction. After an adjacent enemy hits you with a move that deals damage, use Comeuppance to deal exactly 1.5x the damage to the enemy that you received. Do not apply weakness or resistances."||Tough|Incredible||1|Melee|||||
Confuse Ray|Ranged(20ft)|Ghost|Effect|1/day||||On hit, the target becomes Confused.||Clever|Unsettling||1|Ranged|20||||
Confusion|Ranged(10ft)|Psychic|Special|At-Will|1|d12||On hit, if you got 19 or higher on Accuracy Check, the target is Confused.|Telekinetic|Clever|Appeal|1d12|0|Ranged|10|||1|d12
Confusioning|Ranged(20ft)|Psychic|Special|At-Will|1|d12||||||1d12|0|Ranged|20|||1|d12
Constrict|Melee|Normal|Attack|At-Will|1|d6||On hit, the target’s Speed is -1 for 10 mins. This effect cannot be stacked.||Tough|Torrential Appeal|1d6|0|Melee||||1|d6
Continental Crush|Ranged(60ft, 20ft blast)|Rock|(Variable)|1/day|8|d12||||||8d12|1|Ranged|60|blast|20|8|d12
Conversion|Self|Normal|Effect|At-Will||||Put a Type Coat on yourself. The Coat has the following ability: Your Type changes to a type matching one of your known moves for two minutes or your Type changes to a type that resists that last attack you were hit by for two minutes.||Beauty|Catching Up||0|Self|||||
Core Enforcer|Ranged(40ft, 10ft blast)|Dragon|Special|3/day|3|d12||If any targets acted before you this turn, they lose all ability passives for 10 mins.||||3d12|3|Ranged|40|blast|10|3|d12
Corkscrew Crash|Melee(25ft burst)|Steel|(Variable)|1/day|8|d12||Immediately move next to your target, then roll your accuracy check.||||8d12|1|Melee|25|burst||8|d12
Corrosive Gas|Melee|Poison|Effect|3/day||||On hit, destroy the target’s held item, if any. Corrosive Gas cannot destroy Mega Stones.|Repulsive|Clever|Unsettling||3|Melee|||||
Counter|Melee|Fighting|Effect|1/day||||Counter is used as a Reaction. After an enemy hits you with a melee Attack move that deals damage, use Counter to deal exactly twice the damage to the enemy that you received. Do not apply weakness or resistances.||Tough|Final Appeal||1|Melee|||||
Covet|Melee|Normal|Attack|3/day|2|d8||On hit, steals the target's held item, if any.||Cute|Attention Grabber|2d8|3|Melee||||2|d8
Crabhammer|Melee|Water|Attack|3/day|3|d10|-2|Crabhammer has -2 during Accuracy Check. On hit, if you got 18 or higher on Accuracy Check, Crabhammer is a critical hit.||Tough|Round Starter|3d10|3|Melee||||3|d10
Crafty Shield|Ranged(20ft burst)|Fairy|Effect|3/day||||Put a Crafty Coat on all allies and yourself. The Coat has the following ability: You cannot become afflicted or have any stats altered by enemies. This Coat lasts for 2 rounds.||Clever|Inversed Appeal||3|Ranged|20|burst|||
Cross Chop|Melee|Fighting|Attack|1/day|5|d12|-2|Cross Chop has -2 during Accuracy Check. On hit, if you got 16 or higher on Accuracy Check, Cross Chop is a critical hit.||Cool|Round Ender|5d12|1|Melee||||5|d12
Cross Poison|Melee|Poison|Attack|3/day|3|d8||On hit, if you got 18 or higher on Accuracy Check, Cross Poison is a critical hit and the target is Poisoned.||Cool|Appeal|3d8|3|Melee||||3|d8
Crunch|Melee|Dark|Attack|3/day|3|d10||On hit, the target’s Defense is -1 for 10 mins. This effect cannot be stacked.||Tough|Round Starter|3d10|3|Melee||||3|d10
Crush Claw|Melee|Normal|Attack|3/day|3|d8||On hit, the target's Defense is -1 for 10 mins. This effect cannot be stacked.||Cool|Appeal|3d8|3|Melee||||3|d8
Crush Grip|Melee|Normal|Attack|1/day|2|d10||If you are at Max HP, Crush Grip has 5d12 for damage instead.||Tough|Final Appeal|2d10|1|Melee||||2|d10
Curative Barrage|Melee|Normal|Effect|At-Will||||Curative Barrage cannot miss an ally. If Curative Barrage was used against the same human target during your last action as well, the human target is cured of Sleep, a Burn, Confusion, Paralysis, Poisoning or Toxification.|||||0|Melee|||||
Curse|Ranged(20ft)|Ghost|Effect|1/day||||Curse can only be used by Ghost-Type Pokémon. On hit, you lose hit points equal to 1/3rd of your max HP, then the target is Cursed.||Tough|Torrential Appeal||1|Ranged|20||||
Cut|Melee|Normal|Attack|At-Will|2|d6||||Cool|Appeal|2d6|0|Melee||||2|d6
Cutesy Coercion|Ranged(10ft)|Normal|Effect|1/day||||If the target is a Pokémon and has not acted yet during this round of combat, you choose where it moves, what it targets, and what attack it uses this round (You may not use the controlled Pokémon to attack a non-Pokémon target; you know the controlled Pokémon's move list during this turn).|||||1|Ranged|10||||
Dark Pulse|Ranged(10ft)|Dark|Special|3/day|3|d10||On hit, if you got 16 or higher on Accuracy Check, the target is Stunned.||Cool|Round Starter|3d10|3|Ranged|10|||3|d10
Dark Sign|Ranged(10ft)|Dark|Effect|1/day||||On hit, the target is put Asleep.|||||1|Ranged|10||||
Dark Void|Ranged(40ft burst)|Dark|Effect|3/day||||All targets are put to Endless Sleep. Endless Sleep’s check starts at 19 and does not lower each turn like the normal Sleep affliction. Endless Sleep can only be cured with a successful check. If anyone is knocked unconscious while afflicted with Endless Sleep, they are cured of Endless Sleep.|||||3|Ranged|40|burst|||
Darkest Lariat|Melee|Dark|Attack|3/day|3|d10||||Cool|Special Attention|3d10|3|Melee||||3|d10
Dazzling Gleam|Ranged(15ft, 10ft wave)|Fairy|Special|3/day|3|d8||||Beauty|Reflective Appeal|3d8|3|Ranged|15|wave|10|3|d8
Decorate|Melee|Normal|Effect|3/day||||Target an ally or yourself. The target's Attack, Special Attack, Defense, Special Defense, or Speed is raised +2 for five mins. This effect cannot be stacked.||Cute|Get Ready!||3|Melee|||||
Defog|Ranged(30ft burst)|Flying|Effect|3/day||||Any Walls, Hazards, Weather, or Terrains within range are destroyed.||Beauty|Hold That Thought||3|Ranged|30|burst|||
Destiny Bond|Ranged(50ft)|Ghost|Effect|1/day||||" If you are knocked out before your next turn, the offender who caused you to get knocked out has its HP set to 0."||Clever|Big Show||1|Ranged|50||||
Detect|Self|Fighting|Effect|1/day||||Detect is used as a Reaction. When you would be hit by a move, use Detect to instead ignore the damage and any effects of the attack.||Cool|Inversed Appeal||1|Self|||||
Devastating Drake|Melee(25ft burst)|Dragon|(Variable)|1/day|8|d12||Immediately move next to your target, then roll your accuracy check.||||8d12|1|Melee|25|burst||8|d12
Diamond Storm|Ranged(40ft burst)|Rock|Attack|3/day|3|d20||On hit, your Defense is +2 for 10 mins. This effect cannot be stacked.||||3d20|3|Ranged|40|burst||3|d20
Dig|Melee|Ground|Attack|3/day|3|d10||Dig is a two-turn move. On the first turn, burrow up to 40 ft straight down. On the second turn, burrow up to your movement speed +40 ft, then you can roll Dig’s Accuracy Check and damage.|Burrow|Clever|Special Attention|3d10|3|Melee||||3|d10
Dire Claw|Melee|Poison|Attack|3/day|3|d8||On hit, if you got 14 or higher on Accuracy Check, the target is randomly either Poisoned or Paralysed. On hit, if you got 18 or higher on Accuracy Check, Dire Claw is a critical hit.||Tough|Appeal|3d8|3|Melee||||3|d8
Disable|Ranged(20ft)|Normal|Effect|1/day||||For 1 minute, the attack last used by the target may not be used again.||Clever|Excitement||1|Ranged|20||||
Disarming Voice|Ranged(10ft)|Fairy|Special|At-Will|1|d12||You can’t miss targets with less than 15 Special Defense.||Cute|Unsettling|1d12|0|Ranged|10|||1|d12
Discharge|Ranged(10ft burst)|Electric|Special|3/day|3|d8||On hit, if you got 14 or higher on Accuracy Check, all targets are Paralyzed.|Zapper|Cool|Round Starter|3d8|3|Ranged|10|burst||3|d8
Dive|Melee|Water|Attack|3/day|3|d10||Dive is a two-turn move. On the first turn, swim up to 40 ft straight down, and water is hindering terrain on foe’s attacks against you until your next turn. On the second turn, swim up to your movement speed +40 ft, then you can roll Dive’s Accuracy Check and damage.||Beauty|Special Attention|3d10|3|Melee||||3|d10
Divine Verdict|Ranged(30ft, 5ft blast)|Normal|Special|1/day|5|d12||Divine Verdict's type is chosen when its used and may use Attack for accuracy check and damage instead of Special Attack.||||5d12|1|Ranged|30|blast|5|5|d12
Dizzy Punch|Melee|Normal|Attack|3/day|3|d8||On hit, if you got 16 or higher on Accuracy Check, the target is Confused.||Cool|Inversed Appeal|3d8|3|Melee||||3|d8
Doodle|Ranged(40ft)|Normal|Effect|3/day||||On hit, gain each ability passive that the target has for 10 mins. Doodle can only grant ability passives from one target at a time.||Cute|Round Starter||3|Ranged|40||||
Doom Desire|Ranged(40ft, 30ft blast)|Steel|Special|3/day|5|d20||When you use this attack you immediately end you turn. In two rounds, you may roll Doom Desire's Accuracy Check and damage.||||5d20|3|Ranged|40|blast|30|5|d20
Double Edge|Melee|Normal|Attack|1/day|5|d12||On hit, you lose HP equal to 1/3rd of the damage you deal.||Tough|Big Show|5d12|1|Melee||||5|d12
Double Hit|Melee|Normal|Attack|3/day|2|d8||Double Hit is a Scatter attack. It has two attacks.||Clever|Reliable|2d8|3|Melee||||2|d8
Double Iron Bash|Melee|Steel|Attack|3/day|2|d8||Double Iron Bash is a Scatter attack. It has two attacks. On either hit, if you got 14 or higher on Accuracy Check, the target is Stunned.||||2d8|3|Melee||||2|d8
Double Kick|Melee|Fighting|Attack|3/day|2|d8||Double Kick is a Scatter attack. It has two attacks.||Cool|Reliable|2d8|3|Melee||||2|d8
Double Shock|Melee|Electric|Attack|1/day|5|d12||Double Shock can only be used if you are Electric-type. After use,you lose your Electric typing for 10 mins.||Tough|Big Show|5d12|1|Melee||||5|d12
Double Slap|Melee|Normal|Attack|At-Will|1|d4|-2|Double Slap has -2 during Accuracy Check. Double Slap is a Scatter attack. Up to 5 attacks.||Tough|Reliable|1d4|0|Melee||||1|d4
Double Team|Self|Normal|Effect|1/day||||You create 3 copies of yourself. You may attack from any copy and copies may inhabit spaces up to 25 ft away from each other, though none can be more than 25 ft from any other copies or the original. If a copy is hit, it disappears and you take 1/4th of the damage it would have taken. If your copy is hit by a non-damaging attack the copy is dismissed and you are unaffected by the attack. If you are hit, all copies disappear.||Cool|Reliable||1|Self|||||
Draco Meteor|Ranged(20ft, 10ft blast)|Dragon|Special|1/day|5|d12||After use, your Special Attack is -4 for 10 mins. This effect cannot be stacked.||Clever|Seen Nothing Yet|5d12|1|Ranged|20|blast|10|5|d12
Dragon Ascent|Melee|Dragon or Flying|Attack|3/day|5|d12||Choose Dragon Ascent’s type when attacking.||||5d12|3|Melee||||5|d12
Dragon Breath|Ranged(10ft)|Dragon|Special|At-Will|2|d8||On hit, if you got 18 or higher on Accuracy Check, the target is Paralyzed.||Cool|Round Starter|2d8|0|Ranged|10|||2|d8
Dragon Cheer|Ranged(30ft burst)|Dragon|Effect|3/day||||Put a Cheer Coat on all allies and yourself. The Coat has the following ability: Your attacks are critical hits on natural 18-20. This Coat lasts for 2 min.||Cute|Reliable||3|Ranged|30|burst|||
Dragon Claw|Melee|Dragon|Attack|3/day|3|d10||||Cool|Round Starter|3d10|3|Melee||||3|d10
Dragon Darts|Ranged(10ft)|Dragon|Attack|3/day|2|d8||Dragon Darts is a Scatter attack. It has two attacks.||Cute|Reliable|2d8|3|Ranged|10|||2|d8
Dragon Energy|Ranged(30ft burst)|Dragon|Special|1/day|3|d10||If you are at Max HP, Dragon Energy has 5d12 for damage instead.||||3d10|1|Ranged|30|burst||3|d10
Dragon Hammer|Melee|Dragon|Attack|1/day|3|d12||||Cool|Round Starter|3d12|1|Melee||||3|d12
Dragon Pulse|Ranged(10ft)|Dragon|Special|3/day|3|d10||||Clever|Incentives|3d10|3|Ranged|10|||3|d10
Dragon Rage|Ranged(5ft)|Dragon|Special|3/day|25|||Do not add bonuses of any kind to this damage.||Cool|Appeal|25|3|Ranged|5|||25|
Dragon Rush|Melee|Dragon|Attack|3/day|3|d10|-2|Dragon Rush has -2 during Accuracy Check. On hit, if you got 16 or higher on Accuracy Check, the target is Stunned.||Cool|Round Ender|3d10|3|Melee||||3|d10
Dragon Tail|Melee|Dragon|Attack|3/day|3|d8||On hit, move the target 40ft away.||Clever|Appeal|3d8|3|Melee||||3|d8
Drain Punch|Melee|Fighting|Attack|3/day|2|d8||On hit, you regain HP equal to half of the damage dealt.||Beauty|Good Show!|2d8|3|Melee||||2|d8
Draining Kiss|Melee|Fairy|Special|3/day|2|d8||On hit, you regain HP equal to half of the damage dealt.||Cute|Unsettling|2d8|3|Melee||||2|d8
Dream Eater|Melee|Psychic|Special|1/day|5|d12||Dream Eater can only hit Sleeping targets. On hit, you regain HP equal to half of the damage dealt.||Clever|Good Show!|5d12|1|Melee||||5|d12
Drill Peck|Melee|Flying|Attack|3/day|3|d10||||Cool|Appeal|3d10|3|Melee||||3|d10
Drill Run|Melee|Ground|Attack|3/day|3|d10||On hit, if you got 18 or higher on Accuracy Check, Drill Run is a critical hit.||Cool|Appeal|3d10|3|Melee||||3|d10
Drum Beating|Melee|Grass|Attack|3/day|3|d10||On hit, the target’s Speed is -1 for 10 mins. This effect cannot be stacked.||Tough|Appeal|3d10|3|Melee||||3|d10
Dual Chop|Melee|Dragon|Attack|3/day|2|d8||Dual Chop is a Scatter attack. It has two attacks.||Tough|Reliable|2d8|3|Melee||||2|d8
Dual Wingbeat|Melee|Flying|Attack|3/day|2|d8||Dual Wing-beat is a Scatter attack. It has two attacks.||Cool|Reliable|2d8|3|Melee||||2|d8
Dynamax Cannon|Ranged(100ft)|Dragon|Special|3/day|3|d10||If the target is Dynamax, Gigantamax, or Eternamax, Dynamax Cannon deals +250 damage.||||3d10|3|Ranged|100|||3|d10
Dynamic Punch|Melee|Fighting|Attack|1/day|5|d12|-5|Dynamic Punch has -5 during Accuracy Check. On hit, the target is Confused.||Cool|Round Ender|5d12|1|Melee||||5|d12
Earth Power|Ranged(15ft)|Ground|Special|3/day|3|d10||On hit, the target’s Special Defense is -1 for 10 mins. This effect cannot be stacked.|Groundshaper|Clever|Round Ender|3d10|3|Ranged|15|||3|d10
Earthquake|Ranged(30ft burst)|Ground|Attack|1/day|3|d12|||Groundshaper|Tough|Round Ender|3d12|1|Ranged|30|burst||3|d12
Echoed Voice|Ranged(10ft)|Normal|Special|At-Will|1|d12||Echoed Voice deals +5 damage if you used it during the previous round.||Clever|Reliable|1d12|0|Ranged|10|||1|d12
Eerie Spell|Ranged(30ft)|Psychic|Special|3/day|3|d8||On hit, the attack last used by the target may not be used again for 1 minute.||Clever|Unsettling|3d8|3|Ranged|30|||3|d8
Egg Bomb|Ranged(15ft)|Normal|Attack|3/day|3|d10|-2|Egg Bomb has -2 during Accuracy Check.||Tough|Appeal|3d10|3|Ranged|15|||3|d10
Electric Terrain|Field|Electric|Effect|3/day||||You create a circle of Electrified Terrain with a 60ft diameter. Anyone touching the ground within the Electrified terrain is immune to being put to Sleep. Within the Electrified Terrain, Electric-type attacks deal an additional 8 damage. This terrain disappears after 2 mins.||Clever|Unsettling||3|Field|||||
Electrify|Melee|Electric|Effect|3/day||||The next time the target uses an attack, the attack is treated as being Electric-type.|Zapper|Clever|Hold That Thought||3|Melee|||||
Electro Ball|Ranged(15ft)|Electric|Special|3/day|3|d10||Electro Ball can only be used against targets slower than you.|Zapper|Beauty|Final Appeal|3d10|3|Ranged|15|||3|d10
Electro Drift|Ranged(20ft burst)|Electric|Special|3/day|5|d12||Electro Drift is a critical hit against targets that are hit while Electro Drift is super effective or extremely effective.||||5d12|3|Ranged|20|burst||5|d12
Electro Shot|Ranged(30ft beam)|Electric|Special|1/day|5|d12||Electro Shot is a two-turn move unless it is Raining. On the first turn, do nothing. On the second turn or if it is Raining, your Special Attack is raised +1 for 10 mins, then roll Electro Shot’s Accuracy Check and damage.||Clever|Get Ready!|5d12|1|Ranged|30|beam||5|d12
Electroweb|Ranged(10ft)|Electric|Special|3/day|3|d8||On hit, the target’s Speed is -1 for 10 mins. This effect cannot be stacked.|Threaded|Clever|Hold That Thought|3d8|3|Ranged|10|||3|d8
Ember|Ranged(10ft)|Fire|Special|At-Will|1|d12||On hit, if you got 18 or higher on Accuracy Check, the target is Burned.|Firestarter|Beauty|Appeal|1d12|0|Ranged|10|||1|d12
Emberish|Ranged(20ft)|Fire|Special|At-Will|1|d12||||Beauty|Appeal|1d12|0|Ranged|20|||1|d12
Encore|Ranged(10ft)|Normal|Effect|3/day||||If the target can, it must use the last move it did for the next 3 rounds or until it no longer can.||Cute|Good Show!||3|Ranged|10||||
Endeavor|Melee|Normal|Attack|3/day||||On hit, if the target has more HP than you, the target’s HP is set to equal your HP.||Tough|Final Appeal||3|Melee|||||
Endure|Self|Normal|Effect|1/day||||Endure is used as a Reaction. If you would be hit by an attack that would knock out you, use Endure to instead be left with 1 HP.||Tough|Hold That Thought||1|Self|||||
Energy Ball|Ranged(20ft)|Grass|Special|3/day|3|d10||On hit, the target's Special Defense is -1 for 10 mins. This effect cannot be stacked.||Beauty|Round Starter|3d10|3|Ranged|20|||3|d10
Enigma Transformation|Ranged(25ft)|Normal|Effect|At-Will||||You transform into another non-legendary Pokémon then recover 25 HP. You can use any of the Pokémon’s moves and have all of its passives. You may also use any move that the Pokémon could feasibly learn while transformed. Mew retains all of its moves and passives, but may replace its non-HP stats when Mew transforms with the Pokémon Mew transformed into. 3/day Enigma Transformation can be used as a free action. Enigma Transformation lasts as long as Mew wants it to. Enigma Transformation fails if used by anything but a Mew.|||||0|Ranged|25||||
Eruption|Ranged(30ft burst)|Fire|Special|1/day|3|d10||If you are at Max HP, Eruption has 5d12 for damage instead.||Beauty|Round Ender|3d10|1|Ranged|30|burst||3|d10
Esper Wing|Ranged(30ft)|Psychic|Special|3/day|3|d8||On hit, during your next action if you attack a foe, your move has priority.||Beauty|Appeal|3d8|3|Ranged|30|||3|d8
Eternabeam|Ranged(100ft)|Dragon|Special|3/day|7|d10||You cannot act during the next round.||||7d10|3|Ranged|100|||7|d10
Expanding Force|Ranged(30ft)|Psychic|Special|1/day|3|d12||If you are within Psychic Terrain while using Expanding Force, it deals +2d12 damage on hit.||Clever|Appeal|3d12|1|Ranged|30|||3|d12
Explosion|Ranged(30ft burst)|Normal|Attack|1/day|10|d20||Set your HP to 0, then roll 1d20. On 15 or less, your HP is set to -100% HP and you must make a death savings throw.||Beauty|Big Show|10d20|1|Ranged|30|burst||10|d20
Extrasensory|Ranged(10ft)|Psychic|Special|3/day|3|d10||On hit, if you got 18 or higher on Accuracy Check, the target is Stunned.|Telekinetic|Cool|Round Starter|3d10|3|Ranged|10|||3|d10
Extreme Evoboost|Self|Normal|Effect|1/day||||Your Attack, Defense, Special Attack, Special Defense, and Speed are +6 for 10 mins.|||||1|Self|||||
Extreme Speed|Melee|Normal|Attack|3/day|3|d10||Extreme Speed has Priority and cannot be contested for Priority.||Cool|Quick Set|3d10|3|Melee||||3|d10
Facade|Melee|Normal|Attack|1/day|3|d8||If you have an affliction, use 5d12 as damage instead.||Cute|Final Appeal|3d8|1|Melee||||3|d8
Fairy Lock|Ranged(30ft burst)|Fairy|Effect|1/day||||Until your next turn, Pokémon within range cannot be returned to Poke Balls, nor can they be caught by Poke Balls.||Cute|Hold That Thought||1|Ranged|30|burst|||
Fairy Wind|Ranged(20ft)|Fairy|Special|At-Will|1|d12||||Beauty|Appeal|1d12|0|Ranged|20|||1|d12
Fake Out|Melee|Normal|Attack|At-Will|2|d6||Fake Out has Priority. Fake Out can only be used as your first action during an encounter. On hit, the target is Stunned.||Cute|Round Starter|2d6|0|Melee||||2|d6
False Surrender|Melee|Dark|Attack|1/day|3|d12||You can’t miss targets with less than 20 Defense.||Cute|Round Starter|3d12|1|Melee||||3|d12
Feint Attack|Melee|Dark|Attack|3/day|3|d8||You can’t miss targets with less than 15 Defense.||Clever|Round Ender|3d8|3|Melee||||3|d8
Fell Stinger|Melee|Bug|Attack|At-Will|2|d8||If you knock out a target with Fell Stinger, your Attack is +2 for 10 mins. This effect cannot be stacked.||Clever|Get Ready!|2d8|0|Melee||||2|d8
Fickle Beam|Ranged(30ft beam)|Dragon|Special|1/day|3|d12||On hit, roll 1d20 with no modifiers; on a result of 11 or greater, Fickle Beam deals +2d12 more damage.||Clever|Appeal|3d12|1|Ranged|30|beam||3|d12
Fiery Dance|Ranged(20ft)|Fire|Special|1/day|3|d12||On hit, your Special Attack is +2 for 10 mins. This effect cannot be stacked.|Firestarter|Cool|Round Ender|3d12|1|Ranged|20|||3|d12
Fiery Wrath|Ranged(20ft)|Dark|Special|3/day|3|d10||On hit, if you got 16 or higher on Accuracy Check, the target is Stunned.||||3d10|3|Ranged|20|||3|d10
Fillet Away|Self|Normal|Effect|3/day||||You lose HP equal to half of your Max HP, then your Attack, Special Attack and Speed are +2 for 10 mins.||Tough|Seen Nothing Yet||3|Self|||||
Final Gambit|Melee|Fighting|Special|1/day||||On hit, your HP is set to 0, dealing damage equal to the HP you lost.||Tough|Big Show||1|Melee|||||
Fire Blast|Ranged(40ft, 10ft blast)|Fire|Special|1/day|5|d12|-2|Fire Blast has -2 during Accuracy Check unless it’s Sunny. On hit, if you got 18 or higher on Accuracy Check, the targets are Burned.|Firestarter|Beauty|Round Starter|5d12|1|Ranged|40|blast|10|5|d12
Fire Fang|Melee|Fire|Attack|3/day|3|d8||On hit, if you got 18 or higher on Accuracy Check, the target is randomly either Stunned or Burned.|Firestarter|Beauty|Appeal|3d8|3|Melee||||3|d8
Fire Lash|Melee|Fire|Attack|1/day|3|d12||On hit, the target’s Defense is -1 for 10 mins. This effect cannot be stacked.|Firestarter|Beauty|Round Starter|3d12|1|Melee||||3|d12
Fire Punch|Melee|Fire|Attack|3/day|3|d8||On hit, if you got 17 or higher on Accuracy Check, the target is Burned.||Beauty|Round Starter|3d8|3|Melee||||3|d8
Fire Spin|Ranged(20ft)|Fire|Special|3/day|1|d4||On hit, the target is bound in place for 1d4 rounds. For each round the target is bound, it takes 1d4 damage on its turns.|Firestarter|Beauty|Torrential Appeal|1d4|3|Ranged|20|||1|d4
First Impression|Melee|Bug|Attack|1/day|3|d10||First Impression has Priority. First Impression can only be used as your first action during an encounter. On hit, the target is Stunned.||Cute|Round Starter|3d10|1|Melee||||3|d10
Fishious Rend|Melee|Water|Attack|1/day|3|d8||If the target has not already acted this round, Fishious Rend deals +2d8 damage.||Tough|Incentives|3d8|1|Melee||||3|d8
Fissure|Ranged(25ft beam)|Ground|Attack|1/day||||On hit, roll 1d20. On a natural result of 17, 18, 19, or 20, the target is set to 0 HP.||Tough|Big Show||1|Ranged|25|beam|||
Flail|Melee|Normal|Attack|1/day|1|d10||If you are at less than half of your Max HP, Flail has 1d20 for damage instead. If you are at less than 5 HP, Flail has 5d12 for damage instead.||Cute|Final Appeal|1d10|1|Melee||||1|d10
Flame Burst|Ranged(20ft, 5ft blast)|Fire|Special|3/day|3|d8|||Firestarter|Beauty|Round Starter|3d8|3|Ranged|20|blast|5|3|d8
Flame Charge|Melee|Fire|Attack|At-Will|2|d8||On hit, your Speed is +1 for 10 mins. This effect cannot be stacked.|Firestarter|Tough|Excitement|2d8|0|Melee||||2|d8
Flame Wheel|Melee|Fire|Attack|At-Will|2|d8||On hit, if you got 18 or higher on Accuracy Check, the target is Burned.|Firestarter|Beauty|Reliable|2d8|0|Melee||||2|d8
Flamethrower|Ranged(20ft beam)|Fire|Special|3/day|3|d10||On hit, if you got 18 or higher on Accuracy Check, the target is Burned.|Firestarter|Beauty|Round Starter|3d10|3|Ranged|20|beam||3|d10
Flare Blitz|Melee|Fire|Attack|1/day|5|d12||On hit, you lose HP equal to 1/3rd of the damage you deal and if you got 18 or higher on Accuracy Check, the target is Burned.|Firestarter|Clever|Seen Nothing Yet|5d12|1|Melee||||5|d12
Flash|Ranged(10ft)|Normal|Effect|At-Will||||On hit, the target’s Accuracy Checks are -1 during their next turn. This effect cannot be stacked.|Glow|Beauty|Unsettling||0|Ranged|10||||
Flash Cannon|Ranged(20ft)|Steel|Special|3/day|3|d10||On hit, the target's Special Defense is -1 for 10 mins. This effect cannot be stacked.||Clever|Round Starter|3d10|3|Ranged|20|||3|d10
Flash Kick|Melee|Electric|Attack|1/day|3|d12||On hit, if you got 16 or higher on Accuracy Check, the target is Paralyzed.||||3d12|1|Melee||||3|d12
Flatter|Ranged(10ft)|Normal|Effect|1/day||||On hit, the target is Confused and the target’s Special Attack is +4 until they are no longer Confused.||Clever|Excitement||1|Ranged|10||||
Fleur Cannon|Ranged(40ft, 20ft blast)|Fairy|Special|3/day|5|d20||||||5d20|3|Ranged|40|blast|20|5|d20
Floral Healing|Melee|Fairy|Effect|1/day||||Target an ally or yourself. The target is healed HP equal to half of the target's Max HP. If you are within Grassy Terrain, the target is healed HP equal to 3/4ths of the target's Max HP instead.||Beauty|Reflective Appeal||1|Melee|||||
Flower Shield|Field|Fairy|Effect|3/day||||You create a circle of Flowery Terrain with a 60ft diameter. While within the Flowery terrain, all Grass-types and Fairy-types have +1 Defense and +1 Special Defense. This terrain disappears after 2 mins.||Beauty|Seen Nothing Yet||3|Field|||||
Flower Trick|Ranged(30ft)|Grass|Attack|3/day|2|d8||On hit, Flower Trick always counts as a critical hit. You can’t miss targets with less than 15 Defense.||Cool|Final Appeal|2d8|3|Ranged|30|||2|d8
Fly|Melee|Flying|Attack|1/day|3|d12||Fly is a two-turn move. On the first turn, fly up to 40 ft straight up. On the second turn, fly up to your movement speed +40 ft, then you can roll Fly’s Accuracy Check and damage.|Flight|Clever|Special Attention|3d12|1|Melee||||3|d12
Flying Press|Melee|Fighting/Flying|Attack|1/day|5|d12||Flying Press counts as both a Flying and Fighting type move for effectiveness.||Beauty|Good Show!|5d12|1|Melee||||5|d12
Focus Blast|Ranged(30ft)|Fighting|Special|1/day|5|d12|-2|Focus Blast has -2 during Accuracy Check. On hit, the target’s Special Defense is -1 for 10 mins. This effect cannot be stacked.||Cool|Round Starter|5d12|1|Ranged|30|||5|d12
Focus Punch|Melee|Fighting|Attack|3/day|5|d12||Focus Punch is a two-turn move. On the first turn: if anyone hits you before your next turn, you are Stunned. On the second turn, move up to twice your movement speed, then roll Focus Punch’s Accuracy Check and damage.||Tough|Special Attention|5d12|3|Melee||||5|d12
Follow Me|Ranged(30ft burst)|Normal|Effect|3/day||||On hit, all affected foes will only attack you until you are knocked out.||Cute|Scrambler||3|Ranged|30|burst|||
Force Palm|Melee|Fighting|Attack|3/day|3|d8||On hit, if you got 14 or higher on Accuracy Check, the target is Paralyzed.||Cool|Round Ender|3d8|3|Melee||||3|d8
Foresight|Self|Normal|Effect|At-Will||||You can hit Ghost-types with Normal and Fighting type moves as if they are not immune to those types of attacks for two mins.||Clever|Good Show!||0|Self|||||
Forest's Curse|Ranged(15ft)|Grass|Effect|3/day||||On hit, put a Forest Coat on the target. The Coat has the following ability: You lose your current Types and become only Grass-type for 10 mins.||Clever|Torrential Appeal||3|Ranged|15||||
Freeze Shock|Ranged(40ft, 20ft blast)|Ice|Attack|3/day|3|d12||On hit, if you got 12 or higher on Accuracy Check, the targets are Paralyzed.||||3d12|3|Ranged|40|blast|20|3|d12
Freeze-Dry|Ranged(10ft)|Ice|Special|3/day|3|d8||Freeze-Dry is Super effective against Water types. On hit, if you got 18 or higher on Accuracy Check, the target is Frozen.|Freezer|Beauty|Round Starter|3d8|3|Ranged|10|||3|d8
Freezing Glare|Ranged(20ft)|Psychic|Special|3/day|3|d10||On hit, if you got 18 or higher on Accuracy Check, the target is Frozen.||||3d10|3|Ranged|20|||3|d10
Frenzy Plant|Ranged(25ft beam)|Grass|Special|1/day|5|d20||Frenzy Plant has a recharge turn and -2 during Accuracy Check.|Sprouter|Cool|Seen Nothing Yet|5d20|1|Ranged|25|beam||5|d20
Frost Breath|Ranged(10ft)|Ice|Special|3/day|2|d8|-2|Frost Breath has -2 during Accuracy Check. On hit, Frost Breath always counts as a critical hit.|Freezer|Beauty|Appeal|2d8|3|Ranged|10|||2|d8
Frost Kick|Melee|Ice|Attack|1/day|3|d12||On hit, if you got 16 or higher on Accuracy Check, the target is Frozen.||||3d12|1|Melee||||3|d12
Frustration|Melee|Normal|Attack|3/day|3|d10||Frustration can only be used if you have less than 1 loyalty.||Cute|Round Ender|3d10|3|Melee||||3|d10
Fury Attack|Melee|Normal|Attack|At-Will|1|d4|-2|Fury Attack has -2 during Accuracy Check. Fury Attack is a Scatter attack. Up to 5 attacks.||Cool|Reliable|1d4|0|Melee||||1|d4
Fury Cutter|Melee|Bug|Attack|At-Will|1|d6||For each time you’ve successfully used Fury Cutter against the same target during the encounter, add 1d6 to Fury Cutter’s damage.||Cool|Reliable|1d6|0|Melee||||1|d6
Fury Swipes|Melee|Normal|Attack|At-Will|1|d4|-2|Fury Swipes has -2 during Accuracy Check. Fury Swipes is a Scatter attack. Up to 5 attacks.||Tough|Reliable|1d4|0|Melee||||1|d4
Fusion Bolt|Ranged(20ft)|Electric|Attack|3/day|3|d12||If Fusion Flare was used by anyone during the laster 20 seconds, Fusion Bolt has 7d12 for damage instead.||||3d12|3|Ranged|20|||3|d12
Fusion Flare|Ranged(20ft)|Fire|Special|3/day|3|d12||" If Fusion Bolt was used by anyone during the last 20 seconds, Fusion Flare has 7d12 for damage instead."||||3d12|3|Ranged|20|||3|d12
Future Sight|Ranged(30ft)|Psychic|Special|1/day|5|d12||When you use this attack you immediately end your turn. In two rounds, select any target within 30ft of you to target with Future Sight then you may roll Future Sight's Accuracy Check and damage.||Clever|Round Starter|5d12|1|Ranged|30|||5|d12
G-Max Befuddle|Ranged(80ft, 30ft blast)|Bug|(Variable)|1/GMAX|3|d12||On hit, all targets are randomly Poisoned, Paralyzed, or put to Sleep. You cannot act during the next round.||||3d12|-1|Ranged|80|blast|30|3|d12
G-Max Cannonade|Ranged(80ft, 30ft blast)|Water|(Variable)|1/GMAX|4|d12||On hit, all targets take 1d4 damage when they act until you are no longer Gigantamaxed. You cannot act during the next round.||||4d12|-1|Ranged|80|blast|30|4|d12
G-Max Centiferno|Ranged(80ft, 30ft blast)|Fire|(Variable)|1/GMAX|2|d12||On hit, all targets are bound to the ground for 1d4 turns. You cannot act during the next round.||||2d12|-1|Ranged|80|blast|30|2|d12
G-Max Chi Strike|Ranged(80ft, 30ft blast)|Fighting|(Variable)|1/GMAX|2|d12||On hit, all allies within 60ft heal score critical hits on naturally rolled 19 and 20 until you are no longer Gigantamaxed. You cannot act during the next round||||2d12|-1|Ranged|80|blast|30|2|d12
G-Max Cuddle|Ranged(80ft, 30ft blast)|Normal|(Variable)|1/GMAX|3|d12||On hit, all targets are Infatuated. You cannot act during the next round.||||3d12|-1|Ranged|80|blast|30|3|d12
G-Max Depletion|Ranged(80ft, 30ft blast)|Dragon|(Variable)|1/GMAX|3|d12||On hit, all targets cannot use whatever move they last used until you are no longer Gigantamaxed. You cannot act during the next round.||||3d12|-1|Ranged|80|blast|30|3|d12
G-Max Drum Solo|Ranged(80ft, 30ft blast)|Grass|(Variable)|1/GMAX|6|d12||You cannot act during the next round.||||6d12|-1|Ranged|80|blast|30|6|d12
G-Max Finale|Ranged(80ft, 30ft blast)|Fairy|(Variable)|1/GMAX|2|d12||On hit, all allies within 60ft heal 1d12 HP. You cannot act during the next round.||||2d12|-1|Ranged|80|blast|30|2|d12
G-Max Fireball|Ranged(80ft, 30ft blast)|Fire|(Variable)|1/GMAX|6|d12||You cannot act during the next round.||||6d12|-1|Ranged|80|blast|30|6|d12
G-Max Flavorful|Ranged(80ft, 30ft blast)|Grass|(Variable)|1/GMAX|2|d12||On hit, all allies within 60ft are cured of any afflictions. You cannot act during the next round.||||2d12|-1|Ranged|80|blast|30|2|d12
G-Max Foam Burst|Ranged(80ft, 30ft blast)|Water|(Variable)|1/GMAX|4|d12||On hit, all targets Speed is -2 for 2 mins. You cannot act during the next round.||||4d12|-1|Ranged|80|blast|30|4|d12
G-Max Gold Rush|Ranged(80ft, 30ft blast)|Normal|(Variable)|1/GMAX|3|d12||On hit, all targets are Confused. You cannot act during the next round.||||3d12|-1|Ranged|80|blast|30|3|d12
G-Max Gravitas|Ranged(80ft, 30ft blast)|Psychic|(Variable)|1/GMAX|4|d12||At the center of the blast, you create a circle of Gravity Terrain with a 60ft diameter. Within the terrain, Pokémon may not leave the ground and any Pokémon that are in the air are brought down to the ground. This terrain disappears after 2 mins. You cannot act during the next round.||||4d12|-1|Ranged|80|blast|30|4|d12
G-Max Hydrosnipe|Ranged(80ft, 30ft blast)|Water|(Variable)|1/GMAX|6|d12||You cannot act during the next round.||||6d12|-1|Ranged|80|blast|30|6|d12
G-Max Malodor|Ranged(80ft, 30ft blast)|Poison|(Variable)|1/GMAX|3|d12||On hit, all targets are Poisoned. You cannot act during the next round.||||3d12|-1|Ranged|80|blast|30|3|d12
G-Max Meltdown|Ranged(80ft, 30ft blast)|Steel|(Variable)|1/GMAX|3|d12||On hit, all targets cannot use a move that they used during their previous action for 1 min.||||3d12|-1|Ranged|80|blast|30|3|d12
G-Max One Blow|Ranged(80ft, 30ft blast)|Dark|(Variable)|1/GMAX|3|d12||G-Max One Blow’s effects cannot be ignored. Targets cannot redirect, prevent, or reduce damage from G-Max One Blow. You cannot act during the next round.||||3d12|-1|Ranged|80|blast|30|3|d12
G-Max Rapid Flow|Ranged(80ft, 30ft blast)|Water|(Variable)|1/GMAX|3|d12||G-Max Rapid Flow’s effects cannot be ignored. Targets cannot redirect, prevent, or reduce damage from G-Max Rapid Flow. You cannot act during the next round.||||3d12|-1|Ranged|80|blast|30|3|d12
G-Max Replenish|Ranged(80ft, 30ft blast)|Normal|(Variable)|1/GMAX|3|d12||On hit, all allies within 60ft recover any berries they may have used during this combat, unless they have already recovered a berry this combat. You cannot act during the next round.||||3d12|-1|Ranged|80|blast|30|3|d12
G-Max Resonance|Ranged(80ft, 30ft blast)|Water|(Variable)|1/GMAX|2|d12||On hit, your Defense and Special Defense are +1 for 1 min. You cannot act during the next round.||||2d12|-1|Ranged|80|blast|30|2|d12
G-Max Sandblast|Ranged(80ft, 30ft blast)|Ground|(Variable)|1/GMAX|2|d12||On hit, all targets are bound to the ground for 1d4 turns. You cannot act during the next round.||||2d12|-1|Ranged|80|blast|30|2|d12
G-Max Smite|Ranged(80ft, 30ft blast)|Fairy|(Variable)|1/GMAX|3|d12||On hit, all targets are Confused. You cannot act during the next round.||||3d12|-1|Ranged|80|blast|30|3|d12
G-Max Snooze|Ranged(80ft, 30ft blast)|Dark|(Variable)|1/GMAX|3|d12||On hit, all targets fall Asleep after their next turns. You cannot act during the next round.||||3d12|-1|Ranged|80|blast|30|3|d12
G-Max Steelsurge|Ranged(80ft, 30ft blast)|Steel|(Variable)|1/GMAX|2|d12||On hit, place the Spikes Hazard in the blast area. Spikes Hazard has the following ability: When a foe moves through Spikes Hazard during their turn and are on the ground, they lose 1/8th of their Max HP. This Hazard disappears after 2 mins. You cannot act during the next round.||||2d12|-1|Ranged|80|blast|30|2|d12
G-Max Stonesurge|Ranged(80ft, 30ft blast)|Water|(Variable)|1/GMAX|2|d12||On hit, place the 2 Stealth Rock Hazards in the blast zone. Stealth Rock Hazard has the following ability: If a foe moves within 20 ft of Stealth Rock Hazard, it will hurl itself at the foe, destroying itself and dealing 2d12 Rock-type damage to the foe without needing an Accuracy Check. You cannot act during the next round.||||2d12|-1|Ranged|80|blast|30|2|d12
G-Max Stun Shock|Ranged(80ft, 30ft blast)|Electric|(Variable)|1/GMAX|3|d12||On hit, all targets are randomly Poisoned or Paralyzed. You cannot act during the next round.||||3d12|-1|Ranged|80|blast|30|3|d12
G-Max Terror|Ranged(80ft, 30ft blast)|Ghost|(Variable)|1/GMAX|2|d12||On hit, all targets are bound to the ground for 1d4 turns. You cannot act during the next round.||||2d12|-1|Ranged|80|blast|30|2|d12
G-Max Vine Lash|Ranged(80ft, 30ft blast)|Grass|(Variable)|1/GMAX|4|d12||On hit, all targets take 1d4 damage when they act until you are no longer Gigantamaxed. You cannot act during the next round.||||4d12|-1|Ranged|80|blast|30|4|d12
G-Max Volcalith|Ranged(80ft, 30ft blast)|Rock|(Variable)|1/GMAX|4|d12||On hit, all targets take 1d4 damage when they act until you are no longer Gigantamaxed. You cannot act during the next round.||||4d12|-1|Ranged|80|blast|30|4|d12
G-Max Volcalith|Ranged(80ft, 30ft blast)|Rock|(Variable)|1/GMAX|4|d12||On hit, all targets take 1d4 damage when they act until you are no longer Gigantamaxed. You can-not act during the next round.||||4d12|-1|Ranged|80|blast|30|4|d12
G-Max Volt Crash|Ranged(80ft, 30ft blast)|Electric|(Variable)|1/GMAX|3|d12||On hit, all targets are Paralyzed. You cannot act during the next round.||||3d12|-1|Ranged|80|blast|30|3|d12
G-Max Wildfire|Ranged(80ft, 30ft blast)|Fire|(Variable)|1/GMAX|4|d12||On hit, all targets take 1d4 damage when they act until you are no longer Gigantamaxed. You cannot act during the next round.||||4d12|-1|Ranged|80|blast|30|4|d12
G-Max Wind Rage|Ranged(80ft, 30ft blast)|Flying|(Variable)|1/GMAX|4|d12||On hit, remove all weather, terrain, hazards, coats, from the battlefield. You cannot act during the next round.||||4d12|-1|Ranged|80|blast|30|4|d12
Gastro Acid|Ranged(10ft)|Poison|Effect|3/day||||On hit, the target cannot benefit from any passives unless it's a passive that raises its stats for 10 mins.|Repulsive|Beauty|Hold That Thought||3|Ranged|10||||
Gear Grind|Melee|Steel|Attack|3/day|2|d8||Gear Grind is a Scatter attack. It has two attacks.||Cool|Reliable|2d8|3|Melee||||2|d8
Geomancy|Self|Fairy|Effect|3/day||||Your Special Attack, Special Defense, and Speed are +4 for 10 mins|||||3|Self|||||
Giga Drain|Melee|Grass|Special|1/day|3|d12||On hit, you regain HP equal to half of the damage dealt.||Clever|Good Show!|3d12|1|Melee||||3|d12
Giga Impact|Melee(10ft burst)|Normal|Attack|1/day|5|d20|-2|Giga Impact has a recharge turn and -2 during Accuracy Check.||Beauty|Seen Nothing Yet|5d20|1|Melee|10|burst||5|d20
Gigaton Hammer|Ranged(5ft burst)|Steel|Attack|1/day|5|d12||||Cute|Big Show|5d12|1|Ranged|5|burst||5|d12
Gigavolt Havoc|Ranged(60ft, 20ft blast)|Electric|(Variable)|1/day|8|d12||||||8d12|1|Ranged|60|blast|20|8|d12
Glacial Lance|Ranged(50ft burst)|Ice|Attack|3/day|5|d20||||||5d20|3|Ranged|50|burst||5|d20
Glaciate|Ranged(40ft)|Ice|Attack|3/day|3|d12||On hit, the target’s Speed is -1 for 10 mins. This effect cannot be stacked.|Freezer|Beauty|Appeal|3d12|3|Ranged|40|||3|d12
Glaive Rush|Melee|Dragon|Attack|1/day|5|d12||Until your next turn, you take double the damage you would fromsuccessful attacks.||Tough|Good Show!|5d12|1|Melee||||5|d12
Glare|Ranged(20ft)|Normal|Effect|1/day||||On hit, the target becomes Paralyzed.||Tough|Excitement||1|Ranged|20||||
Grass Knot|Melee|Grass|Special|3/day|3|d10||Grass Knot can only target heavier targets.|Sprouter|Clever|Incentives|3d10|3|Melee||||3|d10
Grass Whistle|Ranged(20ft burst)|Grass|Effect|1/day|||-5|Grass Whistle has -5 during Accuracy Check. On hit, all targets fall Asleep.||Clever|Excitement||1|Ranged|20|burst|||
Grassy Glide|Melee|Grass|Attack|3/day|3|d8||Grassy Glide has priority if you’re in Grassy Terrain.||Cool|Appeal|3d8|3|Melee||||3|d8
Grassy Terrain|Field|Grass|Effect|3/day||||You create a circle of Grassy Terrain with a 60ft diameter. Anyone who acts within the Grassy terrain recovers 1d12 HP after acting. Within the Grassy Terrain, Grass-type attacks deal an additional 8 damage. This terrain disappears after 2 mins.||Cute|Good Show!||3|Field|||||
Grav Apple|Ranged(15ft)|Grass|Attack|3/day|3|d10||On hit, the target’s Defense is -1 for 10 mins. This effect cannot be stacked.||Cool|Inversed Appeal|3d10|3|Ranged|15|||3|d10
Gravity|Field|Psychic|Effect|3/day||||You create a circle of Gravity Terrain with a 60ft diameter. Within the terrain, Pokémon may not leave the ground and any Pokémon that are in the air are brought down to the ground. This terrain disappears after 2 mins.||Beauty|Hold That Thought||3|Field|||||
Guardian Sign|Ranged(25ft)|Normal|Effect|1/day||||Guardian Sign is used as a Reaction (as your action if you haven't acted yet this round). If one of your Pokémon, your Helpful Pokémon, or your Companion Pokémon is hit by an attack, ignore the damage and any effects of the attack.|||||1|Ranged|25||||
Guillotine|Melee|Normal|Attack|1/day||||On hit, roll 1d20. On a natural result of 17, 18, 19, or 20, the target is set to 0 HP.||Cool|Big Show||1|Melee|||||
Gunk Shot|Ranged(20ft, 10ft blast)|Poison|Attack|1/day|5|d12||On hit, if you got 14 or higher on Accuracy Check, the target is Poisoned.|Repulsive|Cool|Appeal|5d12|1|Ranged|20|blast|10|5|d12
Gust|Ranged(20ft)|Flying|Special|At-Will|1|d12||If the target is at least 20 ft off the ground airborne, Gust deals +1d20 damage.|Guster|Clever|Appeal|1d12|0|Ranged|20|||1|d12
Gyro Ball|Melee|Steel|Attack|3/day|3|d10||Gyro Ball can only target faster targets.||Beauty|Final Appeal|3d10|3|Melee||||3|d10
Hail|Field|Ice|Effect|3/day||||You create a circle of Hailing Weather with a 60ft diameter. Anyone who acts within the Hailing weather takes 2d4 damage after acting unless they are Ice Type. This weather disappears after 2 mins.||Beauty|Hold That Thought||3|Field|||||
Hammer Arm|Melee|Fighting|Attack|1/day|5|d12||On hit, your Speed is -1 for 10 mins. This effect cannot be stacked.||Tough|Slow Set|5d12|1|Melee||||5|d12
Haze|Field|Ice|Effect|3/day||||You create a circle of Hazy Weather with a 60ft diameter. Within the Hazy weather, all stat altering passives are disabled. Stats cannot be altered by anything within the Hazy weather. This weather disappears after 2 mins.||Beauty|Hold That Thought||3|Field|||||
Head Charge|Melee|Normal|Attack|3/day|3|d12||On hit, you lose HP equal to 1/4th of the damage you deal.||Tough|Appeal|3d12|3|Melee||||3|d12
Head Smash|Melee|Rock|Attack|1/day|7|d12||On hit, you lose HP equal to half of the damage you deal. Head Smash has -2 during Accuracy Check.||Tough|Seen Nothing Yet|7d12|1|Melee||||7|d12
Headbutt|Melee|Normal|Attack|At-Will|2|d8||On hit, if you got 18 or higher on Accuracy Check, the target is Stunned.||Tough|Appeal|2d8|0|Melee||||2|d8
Headlong Rush|Melee|Ground|Attack|1/day|5|d12||On hit, your Defense and Special Defense are -2 for 10 mins. This effect cannot be stacked.||Tough|Big Show|5d12|1|Melee||||5|d12
Heal Bell|Ranged(10ft burst)|Normal|Effect|1/day||||You and all allies within range are cured of all afflictions.||Beauty|Reflective Appeal||1|Ranged|10|burst|||
Heal Block|Ranged(30ft burst)|Psychic|Effect|1/day||||All affected targets cannot be healed or heal for 1 minute.||Cute|Hold That Thought||1|Ranged|30|burst|||
Heal Order|Self|Bug|Effect|1/day||||You are healed HP equal to half of your Max HP.||Clever|Reflective Appeal||1|Self|||||
Heal Pulse|Ranged(10ft)|Psychic|Effect|1/day||||Target an ally or yourself. The target is healed HP equal to half of the target’s Max HP.||Beauty|Reflective Appeal||1|Ranged|10||||
Healing Wish|Melee|Psychic|Effect|1/day||||Your HP is set to 0, then target ally is healed to Max HP and cured of any afflictions.||Cute|Torrential Appeal||1|Melee|||||
Heart Stamp|Melee|Psychic|Attack|At-Will|2|d8||On hit, if you got 18 or higher on Accuracy Check, the target is Stunned.||Cute|Appeal|2d8|0|Melee||||2|d8
Heat Crash|Melee|Fire|Attack|3/day|3|d10||Heat Crash can only target lighter targets.|Firestarter|Tough|Incentives|3d10|3|Melee||||3|d10
Heat Flash|Ranged(10ft)|Fire|Effect|At-Will|1|d4||On hit, the target's Accuracy Checks are -1 during their next turn. This effect cannot be stacked.||||1d4|0|Ranged|10|||1|d4
Heat Wave|Ranged(25ft burst)|Fire|Special|1/day|3|d12||On hit, if you got 17 or higher on Accuracy Check, targets are Burned.|Firestarter|Beauty|Round Starter|3d12|1|Ranged|25|burst||3|d12
Heavy Slam|Melee|Steel|Attack|3/day|3|d10||Heavy Slam can only target lighter targets.||Tough|Incentives|3d10|3|Melee||||3|d10
Helping Hand|Melee|Normal|Effect|3/day||||Target ally’s next attack during this round will deal +1d20 damage.||Clever|Good Show!||3|Melee|||||
Hex|Ranged(15ft)|Ghost|Special|3/day|3|d8||If the target is afflicted, Hex has 5d8 for damage instead.||Clever|Incentives|3d8|3|Ranged|15|||3|d8
Hidden Power|Ranged(25ft)|(Variable)|Special|3/day|3|d8||When Hidden Power is added to a move list, assign a random Type to it.||Clever|Catching Up|3d8|3|Ranged|25|||3|d8
High Horsepower|Melee|Ground|Attack|3/day|3|d10||||Clever|Round Ender|3d10|3|Melee||||3|d10
High Jump Kick|Melee|Fighting|Attack|1/day|5|d12|-2|High Jump Kick has -2 during Accuracy Check. If you miss, you lose HP equal to half of your Max HP.||Cool|Appeal|5d12|1|Melee||||5|d12
Hold Back|Melee|Normal|Attack|At-Will|2|d6||Hold Back cannot be used to knock out a target. Instead, the target will still have 1 HP.||Cool|Inversed Appeal|2d6|0|Melee||||2|d6
Horn Attack|Melee|Normal|Attack|At-Will|2|d8||||Cool|Appeal|2d8|0|Melee||||2|d8
Horn Drill|Melee|Normal|Attack|1/day||||On hit, roll 1d20. On a natural result of 17, 18, 19, or 20, the target is set to 0 HP.||Cool|Big Show||1|Melee|||||
Horn Leech|Melee|Grass|Attack|1/day|3|d12||On hit, you regain HP equal to half of the damage dealt.||Clever|Good Show!|3d12|1|Melee||||3|d12
Hurricane|Ranged(25ft, 10ft blast)|Flying|Special|1/day|5|d12|-2|Hurricane has -2 during Accuracy Check unless it’s Raining. On hit, if you got 14 or higher on Accuracy Check, the targets are Confused.|Guster|Cool|Round Starter|5d12|1|Ranged|25|blast|10|5|d12
Hydro Cannon|Ranged(25ft beam)|Water|Special|1/day|5|d20|-2|Hydro Cannon has a recharge turn and -2 during Accuracy Check.|Fountain|Beauty|Seen Nothing Yet|5d20|1|Ranged|25|beam||5|d20
Hydro Pump|Ranged(30ft beam)|Water|Special|1/day|5|d12|-2|Hydro Pump has -2 during Accuracy Check unless it’s Raining.|Fountain|Beauty|Round Starter|5d12|1|Ranged|30|beam||5|d12
Hydro Steam|Ranged(40ft beam)|Water|Special|3/day|3|d12||Hydro Steam is not weakened by Sunny weather and instead deals +8 damage.||||3d12|3|Ranged|40|beam||3|d12
Hydro Surge|Ranged(30ft beam, 10ft blast)|Water|Special|1/day|5|d12||If it’s Raining, Hydro Surge has +2 during Accuracy Check.||||5d12|1|Ranged|30|beamblast|10|5|d12
Hydro Vortex|Ranged(60ft, 20ft blast)|Water|(Variable)|1/day|8|d12||||||8d12|1|Ranged|60|blast|20|8|d12
Hyper Beam|Ranged(25ft beam)|Normal|Special|1/day|5|d20|-2|Hyper Beam has a recharge turn and -2 during Accuracy Check.||Cool|Seen Nothing Yet|5d20|1|Ranged|25|beam||5|d20
Hyper Blast|Ranged(25ft beam)|Normal|Special|1/day|5|d20|-2|Hyper Blast has -2 during Accuracy Check. You may have Hyper Blast be a Psychic-type attack.||||5d20|1|Ranged|25|beam||5|d20
Hyper Drill|Melee|Normal|Attack|3/day|3|d10||Hyper Drill cannot be prevented by reaction moves.||Clever|Seen Nothing Yet|3d10|3|Melee||||3|d10
Hyper Fang|Melee|Normal|Attack|3/day|3|d10||On hit, if you got 18 or higher on Accuracy Check, the target is Stunned.||Cool|Round Ender|3d10|3|Melee||||3|d10
Hyper Voice|Ranged(30ft beam)|Normal|Special|1/day|3|d12||||Cool|Appeal|3d12|1|Ranged|30|beam||3|d12
Hyperspace Fury|Ranged(40ft, 10ft blast)|Dark|Special|3/day|3|d12||Hyperspace Fury cannot miss.||||3d12|3|Ranged|40|blast|10|3|d12
Hyperspace Hole|Ranged(40ft, 10ft blast)|Ghost|Attack|3/day|3|d12||Hyperspace Hole cannot miss.||||3d12|3|Ranged|40|blast|10|3|d12
Hypnosis|Ranged(10ft)|Psychic|Effect|3/day|||-4|Hypnosis has -4 during Accuracy Check. On hit, the target is put Asleep.||Clever|Excitement||3|Ranged|10||||
Ice Ball|Melee|Ice|Attack|At-Will|1|d6||For each time you've successfully used Ice Ball against the same target during the encounter, add 1d6 to Ice Ball's damage.||Beauty|Round Starter|1d6|0|Melee||||1|d6
Ice Beam|Ranged(20ft beam)|Ice|Special|3/day|3|d10||On hit, if you got 18 or higher on Accuracy Check, the target is Frozen.|Freezer|Beauty|Round Starter|3d10|3|Ranged|20|beam||3|d10
Ice Burn|Ranged(40ft, 20ft blast)|Ice|Special|3/day|3|d12||On hit, if you got 12 or higher on Accuracy Check, the targets are Burned.||||3d12|3|Ranged|40|blast|20|3|d12
Ice Fang|Melee|Ice|Attack|3/day|3|d8||On hit, if you got 18 or higher on Accuracy Check, the target is randomly either Stunned or Frozen.|Freezer|Cool|Appeal|3d8|3|Melee||||3|d8
Ice Hammer|Melee|Ice|Attack|1/day|5|d12||On hit, your Speed is -1 for 10 mins. This effect cannot be stacked.||Cool|Slow Set|5d12|1|Melee||||5|d12
Ice Punch|Melee|Ice|Attack|3/day|3|d8||On hit, if you got 17 or higher on Accuracy Check, the target is Frozen.||Beauty|Round Starter|3d8|3|Melee||||3|d8
Ice Shard|Ranged(15ft)|Ice|Attack|At-Will|2|d6||Ice Shard has Priority.||Beauty|Quick Set|2d6|0|Ranged|15|||2|d6
Ice Spinner|Melee|Ice|Attack|3/day|3|d8||Destroy any Terrain effects that you move through while using Ice Spinner. You may target Terrain with Ice Spinner without needing to roll Accuracy Check or damage.||Beauty|Round Starter|3d8|3|Melee||||3|d8
Icicle Crash|Ranged(15ft)|Ice|Attack|3/day|3|d10||On hit, if you got 14 or higher on Accuracy Check, the target is Stunned.||Tough|Appeal|3d10|3|Ranged|15|||3|d10
Icicle Spear|Ranged(10ft)|Ice|Attack|At-Will|1|d4|-2|Icicle Spear has -2 during Accuracy Check. Icicle Spear is a Scatter attack. Up to 5 attacks.||Beauty|Reliable|1d4|0|Ranged|10|||1|d4
Icy Breeze|Ranged(20ft)|Ice|Special|At-Will|2|d6||||||2d6|0|Ranged|20|||2|d6
Icy Wind|Ranged(10ft)|Ice|Special|At-Will|2|d8||On hit, the target’s Speed is -1 for 10 mins. This effect cannot be stacked.|Freezer|Beauty|Slow Set|2d8|0|Ranged|10|||2|d8
Impenetrable Stance|Ranged(40ft)|Normal|Effect|1/day||||Impenetrable Stance is used as a Reaction. If you are hit by an attack, ignore the damage and any effects of the attack. As long as you do not move or make another attack during the next three rounds of combat, you are immune to any damage from attacks, you cannot be given afflictions, and you do not take damage from the effects of any moves. If you are moved, the effects of Impenetrable Stance ends.|||||1|Ranged|40||||
Incinerate|Ranged(10ft)|Fire|Special|At-Will|1|d10||On hit, if the target is holding a Berry, you destroy it.|Firestarter|Beauty|Appeal|1d10|0|Ranged|10|||1|d10
Infernal Parade|Ranged(30ft)|Ghost|Special|1/day|3|d8||If the target is afflicted, Infernal Parade has 3d12 for damage instead. On hit, if you got 16 or higher on Accuracy Check, the target is Burned.||Beauty|Torrential Appeal|3d8|1|Ranged|30|||3|d8
Inferno|Ranged(40ft)|Fire|Special|1/day|5|d12|-5|Inferno has -5 during Accuracy Check. On hit, the target is Burned.||Beauty|Incredible|5d12|1|Ranged|40|||5|d12
Inferno Overdrive|Ranged(60ft, 20ft blast)|Fire|(Variable)|1/day|8|d12||||||8d12|1|Ranged|60|blast|20|8|d12
Infestation|Ranged(20ft)|Bug|Special|At-Will|1|d4||On hit, the target is bound in place for 1d4 rounds. For each round the target is bound, it takes 1d4 damage on its turns.||Clever|Torrential Appeal|1d4|0|Ranged|20|||1|d4
Ingrain|Self|Grass|Effect|1/day||||Put a Root Coat on yourself. The Coat has the following ability: At the beginning of your turn, recover 1d12 HP. You may not move. This Coat lasts for 2 mins.|Sprouter|Clever|Torrential Appeal||1|Self|||||
Instruct|Ranged(15ft)|Psychic|Effect|3/day||||Targeted ally may immediately act if they haven't this round.||Cute|Good Show!||3|Ranged|15||||
Ion Deluge|Field|Electric|Effect|3/day||||You create a circle of Ionic Terrain with a 60ft diameter. Within the Ionic terrain, all Normal-type attacks become Electric-type attacks. This terrain disappears after 2 mins.||Clever|Unsettling||3|Field|||||
Iron Head|Melee|Steel|Attack|3/day|3|d10||On hit, if you got 14 or higher on Accuracy Check, the target is Stunned.||Tough|Round Ender|3d10|3|Melee||||3|d10
Iron Tail|Melee|Steel|Attack|3/day|3|d10|-2|Iron Tail has -2 during Accuracy Check. On hit, the target’s Defense is -1 for 10 mins. This effect cannot be stacked.||Tough|Round Ender|3d10|3|Melee||||3|d10
Ivy Cudgel|Melee|Grass|Attack|3/day|3|d10||On hit, if you got 11 or higher on Accuracy Check, Ivy Cudgel is a critical hit.||||3d10|3|Melee||||3|d10
Jaw Lock|Melee|Dark|Attack|3/day|3|d8||On hit, the target is bound to you for 1d6 rounds.||Tough|Special Attention|3d8|3|Melee||||3|d8
Jet Punch|Melee|Water|Attack|3/day|3|d8||Jet Punch has Priority.||Clever|Quick Set|3d8|3|Melee||||3|d8
Judgment|Ranged(50ft, 10ft blast)|Normal|Special|3/day|5|d20||Judgement's type is chosen when its used.||||5d20|3|Ranged|50|blast|10|5|d20
Jump Kick|Melee|Fighting|Attack|3/day|3|d10|-2|Jump Kick has -2 during Accuracy Check. If you miss, you lose HP equal to half of your Max HP.||Cool|Appeal|3d10|3|Melee||||3|d10
Jungle Healing|Ranged(20ft burst)|Grass|Effect|3/day||||You and any allies in range are each healed HP equal to 1/3rd of your Max HP and are cured of any afflictions.|||||3|Ranged|20|burst|||
Karate Chop|Melee|Fighting|Attack|At-Will|2|d6||On hit, if you got 18 or higher on Accuracy Check, Karate Chop is a critical hit.||Tough|Appeal|2d6|0|Melee||||2|d6
Karate Slap|Melee|Fighting|Attack|At-Will|2|d6||||||2d6|0|Melee||||2|d6
Kinesis|Ranged(10ft)|Psychic|Effect|At-Will||||On hit, the target’s Accuracy Checks are -1 during their next turn. This effect cannot be stacked.||Clever|Get Ready!||0|Ranged|10||||
King’s Shield|Self|Steel|Effect|1/day||||King’s Shield is used as a Reaction. If you would be hit by a melee attack, use King's Shield to instead ignore the damage and any effects of the attack, and also the attacker’s Attack is -4 for 10 mins. This effect cannot be stacked.||Tough|Appeal||1|Self|||||
Knock Off|Melee|Dark|Attack|3/day|3|d8||On hit, the target drops any held items or weapons.||Clever|Appeal|3d8|3|Melee||||3|d8
Kowtow Cleave|Melee|Dark|Attack|1/day|3|d12||You can’t miss targets with less than 15 Defense.||Tough|Round Starter|3d12|1|Melee||||3|d12
Land's Wrath|Ranged(40ft)|Ground|Attack|3/day|5|d12||||||5d12|3|Ranged|40|||5|d12
Language|Self|Normal|Effect|||||Language takes up a move slot, but is not an attack or move with any affect in battle. Language can be learned multiple times. When Language is acquired, chose a human language. You are capable of speaking basic sentences in the chosen languages. If the same human language is chosen by multiple instances of Language, you can speak that language at any level complexity.||||||Self|||||
Laser Focus|Ranged(30ft)|Normal|Effect|3/day||||On hit, your next attack against the same target will be a Critical Hit. You still need to make an Accuracy Check.||Clever|Good Show!||3|Ranged|30||||
Lash Out|Melee|Dark|Attack|1/day|3|d12||If your stats were lowered this round by the target, use 6d12 for damage instead.||Cute|Inversed Appeal|3d12|1|Melee||||3|d12
Last Respects|Melee|Ghost|Attack|1/day|1|d12||Last Respects deals +1d12 damage for each ally who has beenknocked out this encounter (max +7d12)||||1d12|1|Melee||||1|d12
Lava Plume|Ranged(20ft burst)|Fire|Special|1/day|3|d8||On hit, if you got 14 or higher on Accuracy Check, targets are burned.||Tough|Round Starter|3d8|1|Ranged|20|burst||3|d8
Leaf Blade|Melee|Grass|Attack|3/day|3|d10||On hit, if you got 18 or higher on Accuracy Check, Leaf Blade is a critical hit.||Cool|Round Starter|3d10|3|Melee||||3|d10
Leaf Storm|Ranged(30ft beam)|Grass|Special|1/day|5|d12||After use, your Special Attack is -4 for 10 mins. This effect cannot be stacked.||Cute|Seen Nothing Yet|5d12|1|Ranged|30|beam||5|d12
Leaf Tornado|Ranged(10ft)|Grass|Special|At-Will|2|d8||||Beauty|Good Show!|2d8|0|Ranged|10|||2|d8
Leafage|Ranged(20ft)|Grass|Special|At-Will|1|d12||||Cute|Appeal|1d12|0|Ranged|20|||1|d12
Leech Life|Melee|Bug|Attack|3/day|2|d8||On hit, you regain HP equal to half of the damage dealt.||Clever|Good Show!|2d8|3|Melee||||2|d8
Leech Seed|Ranged(10ft)|Grass|Effect|1/day||||On hit, the target gets a Seed Coat. The Coat has the following ability: At the beginning of your turn, if you are within 20 ft of the enemy who gave you the Seed Coat, you lose 1d12 HP. The enemy who gave you the Seed Coat will gain the same amount of HP that you lost. This Coat lasts for 3 mins, or until you are at 0 or less HP.|Sprouter|Clever|Torrential Appeal||1|Ranged|10||||
Let's Snuggle Forever|Melee|Fairy|Attack|1/day|10|d12||Immediately move next to your target, then roll your accuracy check.||||10d12|1|Melee||||10|d12
Lick|Melee|Ghost|Attack|At-Will|1|d8||On hit, if you got 15 or higher on Accuracy Check, the target is Paralyzed.||Tough|Inversed Appeal|1d8|0|Melee||||1|d8
Licking|Melee|Ghost|Attack|At-Will|2|d6||||||2d6|0|Melee||||2|d6
Life Dew|Ranged(20ft burst)|Water|Effect|1/day||||You and any allies in range are each healed HP equal to 1/6th of your Max HP.||Beauty|Incredible||1|Ranged|20|burst|||
Light Screen|Ranged(30ft)|Psychic|Effect|3/day||||Place 40ft of contiguous Light Screen Wall. Light Screen Wall is see through, 12 ft tall, and has the following ability: Special Attacks that target through this wall deal 10 less damage. This Wall disappears after 2 mins.||Beauty|Hold That Thought||3|Ranged|30||||
Liquidation|Ranged(10ft)|Water|Attack|3/day|3|d10||On hit, the target’s Defense is -1 for 10 mins. This effect cannot be stacked.|Fountain|Tough|Round Ender|3d10|3|Ranged|10|||3|d10
Lock-On|Ranged(40ft)|Normal|Effect|1/day||||Your next attack against the same target will not miss.||Clever|Good Show!||1|Ranged|40||||
Lovely Kiss|Melee|Normal|Effect|3/day|||-3|Lovely Kiss has -3 during Accuracy Check. On hit, the target is put Asleep.||Beauty|Excitement||3|Melee|||||
Low Kick|Melee|Fighting|Attack|3/day|3|d10||Low Kick can only target heavier targets.||Tough|Appeal|3d10|3|Melee||||3|d10
Low Sweep|Melee|Fighting|Attack|At-Will|2|d8||On hit, the target's Speed is -1 for 10 mins. This effect cannot be stacked.||Tough|Appeal|2d8|0|Melee||||2|d8
Lucky Chant|Ranged(30ft burst)|Normal|Effect|3/day||||Put a Lucky Coat on all allies and yourself. The Coat has the following ability: If you are hit by a Critical Hit, treat the hit as a regular successful hit. This Coat lasts for 2 rounds.||Cute|Hold That Thought||3|Ranged|30|burst|||
Lumina Crash|Ranged(30ft)|Psychic|Special|3/day|3|d8||On hit, the target’s Special Defense is -2 for 10 mins.||Beauty|Reliable|3d8|3|Ranged|30|||3|d8
Lunar Dance|Ranged(100ft)|Psychic|Effect|1/day||||Your HP is set to 100 unless it’s below 100, the target recovers 500 HP and is cured of any afflictions.|||||1|Ranged|100||||
Lunge|Melee|Bug|Attack|3/day|3|d8||On hit, the target’s Attack is -1 for 10 mins. This effect cannot be stacked.||Tough|Attention Grabber|3d8|3|Melee||||3|d8
Luster Purge|Ranged(20ft)|Psychic|Special|3/day|5|d10||On hit, the target’s Special Defense is -10 for 10 mins. This effect cannot be stacked.||||5d10|3|Ranged|20|||5|d10
Mach Punch|Melee|Fighting|Attack|At-Will|2|d6||Mach Punch has Priority.||Cool|Quick Set|2d6|0|Melee||||2|d6
Mach Speeds|Self|Normal|Effect|3/day||||Your Speed is +8 for 10 mins, your Defense and Special Defense is -3 for 10 mins. This effect cannot be stacked.|||||3|Self|||||
Magic Coat|Melee|Psychic|Effect|3/day||||Put a Magic Coat on the target or yourself. The Coat has the following ability: If you would be given an affliction by a foe, instead that foe receives the affliction. This Coat lasts for 2 rounds.||Beauty|Final Appeal||3|Melee|||||
Magic Powder|Melee|Psychic|Effect|3/day||||On hit, put a Weird Coat on the target. The Coat has the following ability: You lose your Types and become only Psychic-type for 10 mins.||Cute|Excitement||3|Melee|||||
Magic Room|Field|Psychic|Effect|3/day||||You create a circle of Magical Terrain with a 60ft diameter. If within the Magical terrain, Pokémon cannot use any held items. This terrain disappears after 2 mins.||Cute|Scrambler||3|Field|||||
Magical Leaf|Ranged(25ft)|Grass|Special|3/day|3|d8||You can’t miss targets with less than 15 Special Defense.||Beauty|Round Starter|3d8|3|Ranged|25|||3|d8
Magma Storm|Ranged(30ft, 20ft blast)|Fire|Special|1/day|5|d20||On hit, all targets are bound to the ground for 1d4 turns. For each turn the target is bound, it takes 1d20 damage.||||5d20|1|Ranged|30|blast|20|5|d20
Magnet Bomb|Ranged(25ft)|Steel|Attack|3/day|3|d8||You can't miss targets with less than 15 Defense.|Magnetic|Cool|Appeal|3d8|3|Ranged|25|||3|d8
Magnet Pull|Ranged(10ft)|Electric|Effect|3/day||||Magnet Pull can’t miss. On hit, the Steel type target is bound to you.|Magnetic|Clever|Slow Set||3|Ranged|10||||
Magnet Rise|Self|Electric|Effect|3/day||||You gain an immunity to Ground type attacks and gain a flight movement speed equal to half your land speed for two mins.|Magnetic AND Hover|Cute|Hold That Thought||3|Self|||||
Make it Rain|Ranged(10ft burst)|Steel|Special|1/day|5|d12||After use, your Special Attack is -4 for 10 mins.||Cool|Big Show|5d12|1|Ranged|10|burst||5|d12
Malicious Moonsault|Melee(40ft burst)|Dark|Attack|1/day|8|d12||Immediately move next to your target, then roll your accuracy check.||||8d12|1|Melee|40|burst||8|d12
Malignant Chain|Ranged(25ft)|Poison|Special|At-Will|3|d6||On hit, the target is Toxified.||||3d6|0|Ranged|25|||3|d6
Mat Block|Ranged(10ft)|Fighting|Effect|1/day||||Mat Block is used as a Reaction. If an ally within range would be hit by an attack, use Mat Block to instead move to that ally, who ignores the damage and any effects of the attack.||Cool|Inversed Appeal||1|Ranged|10||||
Matcha Gotcha|Melee|Grass|Special|3/day|2|d10||On hit, you regain HP equal to half of the damage dealt. On hit, if you got 17 or higher on Accuracy Check, the target is Burned.||||2d10|3|Melee||||2|d10
Max Airstream|Ranged(80ft, 30ft blast)|Flying|(Variable)|At-Will|4|d12||On hit, all allies within 60ft have +1 speed for 2 mins. You cannot act during the next round.||||4d12|0|Ranged|80|blast|30|4|d12
Max Darkness|Ranged(80ft, 30ft blast)|Dark|(Variable)|At-Will|4|d12||On hit, all targets Special Defense is -1 for 2 mins. You cannot act during the next round.||||4d12|0|Ranged|80|blast|30|4|d12
Max Flare|Ranged(80ft, 30ft blast)|Fire|(Variable)|At-Will|4|d12||At the center of the blast, you create a circle of Sunny Weather with a 60ft diameter. Within the Sunny weather, Fire-type attacks deal an additional 8 damage and Water-type attacks deal 8 less damage. This weather disappears after 2 mins. You cannot act during the next round.||||4d12|0|Ranged|80|blast|30|4|d12
Max Flutterby|Ranged(80ft, 30ft blast)|Bug|(Variable)|At-Will|4|d12||On hit, all targets Special Attack is -1 for 2 mins. You cannot act during the next round.||||4d12|0|Ranged|80|blast|30|4|d12
Max Geyser|Ranged(80ft, 30ft blast)|Water|(Variable)|At-Will|4|d12||At the center of the blast, you create a circle of Raining Weather with a 60ft diameter. Within the Raining weather, Water-type attacks deal an additional 8 damage and Fire-type attacks deal 8 less damage. This weather disappears after 2 mins. You cannot act during the next round.||||4d12|0|Ranged|80|blast|30|4|d12
Max Guard|Self|Normal|Effect|3/day||||Prevent the next 30 damage you would receive until your next action.|||||3|Self|||||
Max Hailstorm|Ranged(80ft, 30ft blast)|Ice|(Variable)|At-Will|4|d12||At the center of the blast, you create a circle of Hailing Weather with a 60ft diameter. Anyone who acts within the Hailing weather takes 2d4 damage after acting unless they are Ice Type. This weather disappears after 2 mins. You cannot act during the next round.||||4d12|0|Ranged|80|blast|30|4|d12
Max Knuckle|Ranged(80ft, 30ft blast)|Fighting|(Variable)|At-Will|4|d12||On hit, all allies within 60ft have +1 Attack for 2 mins. You cannot act during the next round.||||4d12|0|Ranged|80|blast|30|4|d12
Max Lightning|Ranged(80ft, 30ft blast)|Electric|(Variable)|At-Will|4|d12||At the center of the blast, you create a circle of Electrified Terrain with a 60ft diameter. Anyone touching the ground within the Electrified terrain is immune to being put to Sleep. This terrain disappears after 2 mins. You cannot act during the next round||||4d12|0|Ranged|80|blast|30|4|d12
Max Mindstorm|Ranged(80ft, 30ft blast)|Psychic|(Variable)|At-Will|4|d12||At the center of the blast, you create a circle of Psychic Terrain with a 60ft diameter. If touching the ground, within the Psychic Terrain, Priority and Reaction moves may not be used. This terrain disappears after 2 mins. You cannot act during the next round||||4d12|0|Ranged|80|blast|30|4|d12
Max Ooze|Ranged(80ft, 30ft blast)|Poison|(Variable)|At-Will|4|d12||On hit, all allies within 60ft have +1 Special Attack for 2 mins. You cannot act during the next round.||||4d12|0|Ranged|80|blast|30|4|d12
Max Overgrowth|Ranged(80ft, 30ft blast)|Grass|(Variable)|At-Will|4|d12||At the center of the blast, you create a circle of Grassy Terrain with a 60ft diameter. Anyone who acts within the Grassy terrain recovers 1d12 HP after acting. This terrain disappears after 2 mins. You cannot act during the next round.||||4d12|0|Ranged|80|blast|30|4|d12
Max Phantasm|Ranged(80ft, 30ft blast)|Ghost|(Variable)|At-Will|4|d12||On hit, all targets Defense is -1 for 2 mins. You cannot act during the next round.||||4d12|0|Ranged|80|blast|30|4|d12
Max Quake|Ranged(80ft, 30ft blast)|Ground|(Variable)|At-Will|4|d12||On hit, all allies within 60ft have +1 Special Defense for 2 mins. You cannot act during the next round.||||4d12|0|Ranged|80|blast|30|4|d12
Max Rockfall|Ranged(80ft, 30ft blast)|Rock|(Variable)|At-Will|4|d12||At the center of the blast, you create a circle of Sandstorming Weather with a 60ft diameter. Anyone who acts within the Sandstorming weather takes 2d4 damage after acting unless they are Rock-type, Ground-type, or Steel-type. This weather disappears after 2 mins. You cannot act during the next round.||||4d12|0|Ranged|80|blast|30|4|d12
Max Starfall|Ranged(80ft, 30ft blast)|Fairy|(Variable)|At-Will|4|d12||At the center of the blast, you create a circle of Misty Terrain with a 60ft diameter. Within the Misty terrain, Dragon-type attacks are resisted by anyone who is not already resistant to Dragon-type attacks and afflictions cannot be given to anyone. This terrain disappears after 2 mins. You cannot act during the next round||||4d12|0|Ranged|80|blast|30|4|d12
Max Steelspike|Ranged(80ft, 30ft blast)|Steel|(Variable)|At-Will|4|d12||On hit, all allies within 60ft have +1 Defense for 2 mins. You cannot act during the next round.||||4d12|0|Ranged|80|blast|30|4|d12
Max Strike|Ranged(80ft, 30ft blast)|Normal|(Variable)|At-Will|4|d12||On hit, all targets Speed is -1 for 2 mins. You cannot act during the next round.||||4d12|0|Ranged|80|blast|30|4|d12
Max Wyrmwind|Ranged(80ft, 30ft blast)|Dragon|(Variable)|At-Will|4|d12||On hit, all targets Attack is -1 for 2 mins. You cannot act during the next round||||4d12|0|Ranged|80|blast|30|4|d12
Mean Look|Ranged(10ft)|Normal|Effect|1/day||||On hit, the target is bound in place for 2 mins. Ghost Pokémon are immune to Mean Look.||Beauty|Unsettling||1|Ranged|10||||
Mega Drain|Melee|Grass|Special|3/day|2|d10||On hit, you regain HP equal to half of the damage dealt.||Clever|Good Show!|2d10|3|Melee||||2|d10
Mega Evolution|Self|Normal|Effect|3/day||||As a free action, Mega Evolve into Mega Mewtwo X or Mega Mewtwo Y if Mewtwo possesses a Mega Stone for 10 mins.|||||3|Self|||||
Mega Kick|Melee|Normal|Attack|1/day|5|d12|-3|Mega Kick has -3 during Accuracy Check.||Cool|Round Ender|5d12|1|Melee||||5|d12
Mega Punch|Melee|Normal|Attack|3/day|3|d8||||Tough|Round Ender|3d8|3|Melee||||3|d8
Megahorn|Melee|Bug|Attack|1/day|5|d12||||Cool|Round Ender|5d12|1|Melee||||5|d12
Memento|Melee|Dark|Effect|1/day||||Your HP is set to 0, then the target’s Attack and Special Attack are set to 0 for 10 mins.||Tough|Big Show||1|Melee|||||
Metal Burst|Ranged(40ft)|Steel|Effect|1/day||||Metal Burst is used as a Reaction. After an enemy within range hits you with a move that deals damage, use Metal Burst to deal exactly 1.5x the damage to the enemy that you recieved. Do not apply weakness or resistances.||Beauty|Final Appeal||1|Ranged|40||||
Metal Claw|Melee|Steel|Attack|At-Will|2|d6||On hit, your Attack is +1 for 10 mins. This effect cannot be stacked.||Cool|Incentives|2d6|0|Melee||||2|d6
Metal Cut|Melee|Steel|Attack|At-Will|2|d6||||||2d6|0|Melee||||2|d6
Meteor Assault|Melee|Fighting|Attack|1/day|5|d12||On hit, the target is Stunned. This move has a Recharge turn.||Cool|Big Show|5d12|1|Melee||||5|d12
Meteor Beam|Ranged(30ft beam)|Rock|Special|1/day|5|d12||Meteor Beam is a two-turn move. On the first turn, do nothing. On the second turn, you have +4 to Special Attack this turn, then you may roll Meteor Beam’s Accuracy Check and damage.||Clever|Round Starter|5d12|1|Ranged|30|beam||5|d12
Meteor Mash|Melee|Steel|Attack|3/day|3|d10||On hit, your Attack is +1 for 10 mins. This effect cannot be stacked.||Cool|Round Ender|3d10|3|Melee||||3|d10
Meteor Rain|Ranged(20ft, 10ft blast)|Steel|Special|1/day|5|d12||After use, your Special Attack is -4 for 10 mins. This effect cannot be stacked.||||5d12|1|Ranged|20|blast|10|5|d12
Metronome|Varies|Normal|Effect|3/day||||Immediately use a random attack (non-Legendary).||Cute|Scrambler||3|Varies|||||
Mighty Cleave|Melee(10ft burst)|Rock|Attack|3/day|3|d12||Damage from Might Cleave cannot be negated or reduced in Electrified terrain.||||3d12|3|Melee|10|burst||3|d12
Migraine|Self|Normal|Effect|3/day||||You lose HP equal to half of your Max HP, then your Special Attack is +6 for 10 mins. This effect cannot be stacked.|||||3|Self|||||
Milk Drink|Melee|Normal|Effect|1/day||||Target an ally or yourself. The target is healed HP equal to half of the targetâ€™s Max HP.||Cute|Reflective Appeal||1|Melee|||||
Mind Blown|Ranged(20ft burst)|Fire|Special|1/day|5|d20||On hit, you lose 15 Hp.||||5d20|1|Ranged|20|burst||5|d20
Mind Reader|Ranged(40ft)|Normal|Effect|1/day||||Mind Reader can't miss. Your next attack against the same target will not miss.||Clever|Good Show!||1|Ranged|40||||
Mind Rise|Self|Psychic|Effect|3/day||||You gain an immunity to Ground type attacks and gain a flight movement speed equal to your land speed for two mins.|||||3|Self|||||
Mind-reading Disable|Ranged(20ft)|Normal|Effect|3/day||||Chose an attack the target knows. That move cannot be used by the target for 5 mins.|||||3|Ranged|20||||
Minimize|Self|Normal|Effect|3/day||||Until your next turn, attacks made against you have -2 during Accuracy Check. This effect cannot be stacked.|Shrinkable|Cute|Hold That Thought||3|Self|||||
Miracle Eye|Self|Psychic|Effect|3/day||||You can hit Dark-types with Psychic type moves as if they are not immune to that type of attacks for two mins.||Cute|Good Show!||3|Self|||||
Mirror Coat|Ranged(40ft)|Psychic|Effect|1/day||||" Mirror Coat is used as a Reaction. After an enemy hits you with a ranged Special Attack move that deals damage, use Mirror Coat to deal exactly twice the damage to the enemy that you received. Do not apply weakness or resistances."||Beauty|Final Appeal||1|Ranged|40||||
Mirror Move|Ranged(30ft)|Flying|Effect|1/day||||You perform the same attack that was just used against you, even if it missed.||Clever|Final Appeal||1|Ranged|30||||
Mirror Shot|Ranged(20ft)|Steel|Special|At-Will|2|d8||||Cute|Round Starter|2d8|0|Ranged|20|||2|d8
Mist|Field|Ice|Effect|3/day||||You create a circle of Misty Weather with a 60ft diameter. Within the Misty weather, Stats cannot be lowered. This weather disappears after 2 mins.||Beauty|Hold That Thought||3|Field|||||
Mist Ball|Ranged(30ft)|Psychic|Special|3/day|5|d10||On hit, target’s Special Attack is -10 for 10 mins.||||5d10|3|Ranged|30|||5|d10
Misty Explosion|Ranged(30ft burst)|Fairy|Special|1/day|7|d20||Set your HP to 0, then roll 1d20. On 10 or less, your HP is set to -100% HP and you must make a death savings throw.||Cute|Big Show|7d20|1|Ranged|30|burst||7|d20
Misty Terrain|Field|Fairy|Effect|3/day||||You create a circle of Misty Terrain with a 60ft diameter. Within the Misty terrain, Dragon-type attacks are resisted by anyone who is not already resistant to Dragon-type attacks and afflictions cannot be given to anyone. This terrain disappears after 2 mins.||Cute|Scrambler||3|Field|||||
Moonblast|Ranged(20ft)|Fairy|Special|3/day|3|d10||On hit, the target’s Special Attack is -1 for 10 mins. This effect cannot be stacked.||Beauty|Reflective Appeal|3d10|3|Ranged|20|||3|d10
Moongeist Beam|Ranged(40ft beam)|Ghost|Special|3/day|5|d20||Moongeist Beam has +2 during Accuracy Check.||||5d20|3|Ranged|40|beam||5|d20
Moonlight|Melee|Fairy|Effect|1/day||||Target an ally or yourself. The target is healed HP equal to half of the target' Max HP. If you are within Sunny Weather, the target is healed HP equal to 3/4ths of the target's Max HP instead.||Beauty|Reflective Appeal||1|Melee|||||
Moonwrecker|Ranged(20ft, 10ft blast)|Fairy|Special|1/day|5|d12||After use, your Special Attack is -4 for 10 mins. This effect cannot be stacked.||||5d12|1|Ranged|20|blast|10|5|d12
Morning Sun|Melee|Normal|Effect|1/day||||Target an ally or yourself. The target is healed HP equal to half of the target’s Max HP. If you are within Sunny Weather, the target is healed HP equal to 3/4ths of the target’s Max HP instead.||Beauty|Reflective Appeal||1|Melee|||||
Mortal Spin|Melee|Poison|Attack|At-Will|1|d8||Destroy any Coats, and free bound allies within 5 ft. You may target Coats, or bound allies with Mortal Spin without needing to roll Accuracy Check or damage. On hit, if you got 18 or higher on Accuracy Check, the target is Poisoned.||||1d8|0|Melee||||1|d8
Mountain Gale|Ranged(30ft)|Ice|Attack|3/day|3|d10||On hit, if you got 14 on higher on Accuracy Check, the target is Stunned.||Beauty|Appeal|3d10|3|Ranged|30|||3|d10
Mud Bomb|Ranged(10ft)|Ground|Special|3/day|3|d8||On hit, the target’s Accuracy Checks are -1 during their next turn. This effect cannot be stacked.||Clever|Round Ender|3d8|3|Ranged|10|||3|d8
Mud Shot|Ranged(10ft)|Ground|Special|At-Will|2|d8||On hit, the target’s Speed is -1 for 10 mins. This effect cannot be stacked.||Tough|Slow Set|2d8|0|Ranged|10|||2|d8
Mud Sport|Melee|Ground|Effect|At-Will||||Put a Mud Coat on the target or yourself. The Coat has the following ability: Reduce damage from Electric attacks that hit you by 10. This Coat lasts for 2 mins.||Cute|Hold That Thought||0|Melee|||||
Mud Throw|Ranged(20ft)|Ground|Special|At-Will|2|d6||||||2d6|0|Ranged|20|||2|d6
Mud-Slap|Ranged(5ft)|Ground|Special|At-Will|1|d6||On hit, the target’s Accuracy Checks are -1 during their next turn. This effect cannot be stacked.||Cute|Appeal|1d6|0|Ranged|5|||1|d6
Muddy Water|Ranged(20ft, 10ft wave)|Water|Special|1/day|3|d12||On hit, any target’s Accuracy Checks are -2 during their next turn. This effect cannot be stacked.||Tough|Round Ender|3d12|1|Ranged|20|wave|10|3|d12
Multi-Attack|Melee|Normal|Attack|3/day|3|d10||Multi-Attack's Type changes depending on what kind of item Type: Null or Silvally is holding.|||Incentives|3d10|3|Melee||||3|d10
Mystical Fire|Ranged(20ft)|Fire|Special|3/day|3|d8||On hit, the target’s Special Attack is -1 for 10 mins. This effect cannot be stacked.||Beauty|Seen Nothing Yet|3d8|3|Ranged|20|||3|d8
Nature’s Madness|Ranged(25ft)|Fairy|Special|1/day||||On hit, the target’s current HP is halved.||Tough|Appeal||1|Ranged|25||||
Needle Arm|Melee|Grass|Attack|3/day|3|d8||On hit, if you got 14 or higher on Accuracy Check, the target is Stunned.||Clever|Appeal|3d8|3|Melee||||3|d8
Never-Ending Nightmare|Ranged(60ft, 20ft blast)|Ghost|(Variable)|1/day|8|d12||||||8d12|1|Ranged|60|blast|20|8|d12
Night Daze|Ranged(10ft)|Dark|Special|3/day|3|d10||On hit, the target’s Accuracy Checks are -1 during their next turn. This effect cannot be stacked.||Tough|Unsettling|3d10|3|Ranged|10|||3|d10
Night Shade|Ranged(20ft)|Ghost|Special|3/day|20|||Do not add bonuses of any kind to this damage.||||20|3|Ranged|20|||20|
Night Slash|Melee|Dark|Attack|3/day|3|d8||On hit, if you got 18 or higher on Accuracy Check, Night Slash is a critical hit.||Beauty|Appeal|3d8|3|Melee||||3|d8
Nightmare|Ranged(40ft burst)|Ghost|Effect|1/day||||All Sleeping targets are given Nightmare Coats. The Nightmare Coat has the following ability: At the end of your turn, lose 1/3rd of your Max HP. Nightmare Coat is destroyed if the wearer is cured of Sleep or knocked out.|||||1|Ranged|40|burst|||
No Retreat|Self|Fighting|Effect|3/day||||As a free action, as long as you can see a foe, you cannot move away from them, or be returned to a Poke Ball until you are knocked out. Your Attack, Special Attack, Defense, Special Defense, and Speed are each raised +1 for 10 mins. This effect cannot be stacked.||Tough|Get Ready!||3|Self|||||
Nuzzle|Melee|Electric|Attack|3/day|1|d10||On hit, the target is Paralyzed.||Cute|Appeal|1d10|3|Melee||||1|d10
Oblivion Wing|Ranged(25ft burst)|Dark|Special|3/day|3|d12||On hit, you regain HP equal to the damage dealt.||||3d12|3|Ranged|25|burst||3|d12
Obstruct|Self|Dark|Effect|1/day||||Obstruct is used as a Reaction. If you would be hit by an attack, use Obstruct to instead ignore the damage and any effects of the attack. Also, if the ignored attack was a melee attack, the attacker’s Defense is -1 for 10 mins. This effect cannot be stacked.||Tough|Inversed Appeal||1|Self|||||
Oceanic Operetta|Ranged(100ft, 30ft blast)|Water|Special|1/day|8|d12||||||8d12|1|Ranged|100|blast|30|8|d12
Octazooka|Ranged(15ft)|Water|Special|3/day|3|d8||On hit, the target’s Accuracy Checks are -3 during their next turn. This effect cannot be stacked.||Tough|Incentives|3d8|3|Ranged|15|||3|d8
Octolock|Melee|Fighting|Effect|3/day||||On hit, the target is bound to you for 1d6 rounds. While the target is bound, the target’s Defense and Special Defense is -1.||Tough|Round Ender||3|Melee|||||
Odor Sleuth|Self|Normal|Effect|At-Will||||You can hit Ghost-types with Normal and Fighting type moves as if they are not immune to those types of attacks for two mins.|Tracker|Clever|Good Show!||0|Self|||||
Ominous Wind|Ranged(10ft)|Ghost|Special|1/day|2|d8||On hit, your Attack, Special Attack, Defense, Special Defense, and Speed are each raised +1 for 1 hour.||Clever|Get Ready!|2d8|1|Ranged|10|||2|d8
Order Up|Ranged(30ft)|Dragon|Attack|3/day|3|d8||If youhave a Tatsugiri in your mouth using its Commander passive, Order Up will additionally have an effect depending on the form of the Tatsugiri: [Curly] Your Attack is +2 for 10 mins, [Droopy] your Defense is +2 for 10 mins, or [Stretchy] your Speed is +2 for 10 mins.||Cute|Hold That Thought|3d8|3|Ranged|30|||3|d8
Origin Pulse|Ranged(40ft, 30ft wave)|Water|Special|3/day|5|d12||||||5d12|3|Ranged|40|wave|30|5|d12
Outrage|Melee|Dragon|Attack|1/day|5|d12||Outrage is a two-turn move. On each turn, move to the closest character within 25 ft that you can reach, and roll this move’s Accuracy Check and damage against them. After your second turn you are Confused.||Cool|Reliable|5d12|1|Melee||||5|d12
Overdrive|Ranged(10ft burst)|Electric|Special|3/day|3|d10||||Cool|Attention Grabber|3d10|3|Ranged|10|burst||3|d10
Overheat|Ranged(30ft burst)|Fire|Special|1/day|5|d12||After use, your Special Attack is -4 for 10 mins. This effect cannot be stacked.||Beauty|Seen Nothing Yet|5d12|1|Ranged|30|burst||5|d12
Pack Mon|Ranged(20ft burst)|Normal|Effect|1/day||||Pack Mon cannot miss. All wild Pokémon targets that share an egg group with you follow your lead for 1 hour. Wild Pokémon following you will attack with you, defend with you, help to accomplish tasks, and lead others through wild areas when asked to do so by an allied Trainer. Wild Pokémon following you will not attack their own kind, actively destroy their homes, nor leave the wilds following you into a town or city.|||||1|Ranged|20|burst|||
Pain Split|Melee|Normal|Effect|1/day||||On hit, you and target’s current HPs are added together and halved, assigning both you and the target that new value. Neither can have their new HPs be more than their Max.||Clever|Unsettling||1|Melee|||||
Parabolic Charge|Melee|Electric|Special|1/day|3|d12||On hit, you regain HP equal to half of the damage dealt.|Zapper|Cool|Appeal|3d12|1|Melee||||3|d12
Payback|Melee|Dark|Attack|3/day|3|d8||If you were attacked by the target this round, use 3d12 for damage instead.||Cool|Special Attention|3d8|3|Melee||||3|d8
Peck|Melee|Flying|Attack|At-Will|2|d6||||Cool|Appeal|2d6|0|Melee||||2|d6
Perish Song|Ranged(40ft burst)|Normal|Effect|1/day||||All possible Pokémon targets including yourself receive 3 Perish Coats. The Coats have the following ability: After acting, destroy one of your Perish Coats. If this is the third Perish coat you've destroyed during this encounter, set your HP to 0.||Beauty|Unsettling||1|Ranged|40|burst|||
Petal Blizzard|Ranged(10ft burst)|Grass|Attack|3/day|3|d10||||Clever|Appeal|3d10|3|Ranged|10|burst||3|d10
Petal Dance|Ranged(5ft burst)|Grass|Special|1/day|5|d12||Petal Dance is a two-turn move. On each turn, move to the closest character within 25 ft that you can reach, and roll this move’s Accuracy Check and damage against them. After your second turn you are Confused.||Beauty|Torrential Appeal|5d12|1|Ranged|5|burst||5|d12
Phantom Force|Melee|Ghost|Attack|1/day|3|d12||Phantom Force is a two-turn move. On the first turn, disappear from the battlefield. On the second turn, reappear anywhere within 25 ft of where you vanished, move up to twice your movement speed, and roll Phantom Force’s Accuracy Check and damage.||Clever|Seen Nothing Yet|3d12|1|Melee||||3|d12
Photon Geyser|Ranged(160ft beam)|Psychic|Special|3/day|12|d12||You cannot act during the next two rounds.||||12d12|3|Ranged|160|beam||12|d12
Pin Missile|Ranged(10ft)|Bug|Attack|At-Will|1|d4|-2|Pin Missile has -2 during Accuracy Check. Pin Missile is a Scatter attack. Up to 5 attacks.||Cool|Reliable|1d4|0|Ranged|10|||1|d4
Plasma Fists|Melee|Electric|Attack|3/day|3|d12||For 10 mins, if you are hit by a melee attack, the attack is treated as an Electric-type attack.||||3d12|3|Melee||||3|d12
Play Rough|Melee|Fairy|Attack|3/day|3|d10||On hit, the target’s Attack is -1 for 10 mins. This effect cannot be stacked.||Cute|Unsettling|3d10|3|Melee||||3|d10
Poison Fang|Melee|Poison|Attack|3/day|1|d12||On hit, if you got 10 or higher on Accuracy Check, the target is Toxified.||Clever|Incentives|1d12|3|Melee||||1|d12
Poison Gas|Ranged(5ft burst)|Poison|Effect|3/day|||-2|Poison Gas has -2 during Accuracy Check. On hit, all targets are Poisoned.|Repulsive|Clever|Appeal||3|Ranged|5|burst|||
Poison Jab|Melee|Poison|Attack|3/day|3|d8||On hit, if you got 14 or higher on Accuracy Check, the target is Poisoned.||Clever|Incentives|3d8|3|Melee||||3|d8
Poison Powder|Melee|Poison|Effect|At-Will|||-5|Poison Powder has -5 during Accuracy Check. On hit, the target is Poisoned.||Clever|Excitement||0|Melee|||||
Poison Sting|Melee|Poison|Attack|At-Will|1|d4||On hit, if you got 15 or higher on Accuracy Check, the target is Poisoned.||Clever|Excitement|1d4|0|Melee||||1|d4
Poison Tail|Melee|Poison|Attack|3/day|1|d12||On hit, if you got 14 or higher on Accuracy Check, the target is Poisoned; if you got 18 or higher on Accuracy Check, Poison Tail is a critical hit.||Clever|Incentives|1d12|3|Melee||||1|d12
Pollen Puff|Ranged(10ft)|Bug|Special|1/day|3|d12||On hit, you may choose to deal damage with Pollen Puff or heal the target’s HP equal to the amount of damage Pollen Puff would have dealt.||Tough|Torrential Appeal|3d12|1|Ranged|10|||3|d12
Poltergeist|Ranged(20ft)|Ghost|Attack|1/day|5|d12||Poltergeist can only be used if the target has a held item.||Cute|Unsettling|5d12|1|Ranged|20|||5|d12
Population Bomb|Melee|Normal|Attack|3/day|1|d4||Population Bomb is a Scatter attack. Up to 10 attacks.||Beauty|Torrential Appeal|1d4|3|Melee||||1|d4
Pounce|Melee|Bug|Attack|At-Will|2|d6||On hit, the target’s Speed is -1 for 10 mins.||Cute|Inversed Appeal|2d6|0|Melee||||2|d6
Pound|Melee|Normal|Attack|At-Will|2|d6||||Tough|Appeal|2d6|0|Melee||||2|d6
Powder|Melee|Bug|Effect|1/day||||Powder is used as a Reaction. If an enemy within melee range would hit you with a Fire-type attack, use Powder to instead ignore the damage and any effects of the Fire-type attack, and also the enemy loses HP equal to 1/6th of its Max HP.||Clever|Scrambler||1|Melee|||||
Powder Bomb|Ranged(20ft, 10ft blast)|Poison|Effect|3/day||||On hit, any targets are Poisoned.|||||3|Ranged|20|blast|10||
Powder Snow|Ranged(5ft burst)|Ice|Special|At-Will|1|d12||On hit, if you got 19 or higher on Accuracy Check, the target is Frozen.|Freezer|Beauty|Appeal|1d12|0|Ranged|5|burst||1|d12
Power Gem|Ranged(20ft)|Rock|Special|3/day|3|d10||||Beauty|Appeal|3d10|3|Ranged|20|||3|d10
Power Trip|Melee|Dark|Attack|3/day|1|d20||Power Trip deals an additional 1d10 damage for each stat buff Passive the target has.||Tough|Incentives|1d20|3|Melee||||1|d20
Power Whip|Melee|Grass|Attack|1/day|5|d12|-2|Power Whip has -2 during Accuracy Check.|Threaded|Cool|Appeal|5d12|1|Melee||||5|d12
Power-Up Punch|Melee|Fighting|Attack|At-Will|2|d6||On hit, your Attack is +1 for 10 mins. This effect cannot be stacked.||Tough|Appeal|2d6|0|Melee||||2|d6
Precipice Blades|Ranged(35ft burst)|Ground|Attack|3/day|5|d12||||||5d12|3|Ranged|35|burst||5|d12
Present|Ranged(10ft)|Normal|Attack|3/day|3|d8||On hit, you may choose to deal damage with Present or heal the target’s HP equal to the amount of damage Present would have dealt.||Cute|Inversed Appeal|3d8|3|Ranged|10|||3|d8
Prismatic Laser|Ranged(80ft beam)|Psychic|Special|3/day|8|d12||You cannot act during the next round.||||8d12|3|Ranged|80|beam||8|d12
Protect|Self|Normal|Effect|1/day||||Protect is used as a Reaction. When you would be hit by a move, use Protect to instead ignore the damage and any effects of the attack.||Cute|Inversed Appeal||1|Self|||||
Psionic Fury|Ranged(20ft)|Psychic|Special|1/day|5|d12||On hit, your Defense and Special Defense is -2 for 10 mins. This effect cannot be stacked.||||5d12|1|Ranged|20|||5|d12
Psybeam|Ranged(15ft beam)|Psychic|Special|3/day|3|d8||On hit, if you got 18 or higher on Accuracy Check, the target is Confused.||Beauty|Round Starter|3d8|3|Ranged|15|beam||3|d8
Psyblade|Melee(10ft burst)|Psychic|Attack|3/day|3|d12||Psyblade deals +8 damage in Electrified terrain.||||3d12|3|Melee|10|burst||3|d12
Psychic|Ranged(25ft)|Psychic|Special|3/day|3|d10||On hit, the target's Special Defense is -1 for 10 mins. This effect cannot be stacked.|Telekinetic|Clever|Round Starter|3d10|3|Ranged|25|||3|d10
Psychic Fangs|Melee|Psychic|Attack|3/day|3|d10||On hit, Psychic Fangs destroys all walls within melee range. Psychic Fangs can target walls.||Cool|Appeal|3d10|3|Melee||||3|d10
Psychic Force|Ranged(40ft)|Psychic|Special|1/day|5|d12||On hit, the target's Special Defense is -1 for 10 mins. Your Defense and Special Defense is -1 for 10 mins. These effects cannot be stacked.||||5d12|1|Ranged|40|||5|d12
Psychic Terrain|Field|Psychic|Effect|3/day||||You create a circle of Psychic Terrain with a 60ft diameter. Characters touching the ground within the Psychic Terrain are immune to damage dealt by Reaction moves or moves used during Priority turns. Within the Psychic Terrain, Psychictype attacks deal an additional 8 damage This terrain disappears after 2 mins.||Cute|Good Show!||3|Field|||||
Psycho Cut|Ranged(20ft)|Psychic|Attack|3/day|3|d8||On hit, if you got 18 or higher on Accuracy Check, Psycho Cut is a critical hit.||Cool|Round Starter|3d8|3|Ranged|20|||3|d8
Psycho Rage|Self|Psychic|Effect|3/day||||Choose two other different moves except for Recover to use as your attack, ignoring their frequencies. Mewtwo may only use Psycho Rage while below 100 HP.|||||3|Self|||||
Psycho Shift|Melee|Psychic|Effect|1/day||||On hit, you are cured of all afflictions and the target receives each affliction you were cured of.||Cool|Inversed Appeal||1|Melee|||||
Psyphon Punch|Melee|Psychic|Attack|3/day|3|d12||On hit, you regain HP equal to half of the damage dealt.||||3d12|3|Melee||||3|d12
Psyshield Bash|Melee|Psychic|Attack|3/day|3|d8||On hit, your Defense and Special Defense are +1 for 10 mins. This effect cannot be stacked.||||3d8|3|Melee||||3|d8
Psyshock|Ranged(20ft)|Psychic|Special|3/day|3|d10||Psyshock’s Accuracy Check is made against the target’s Defense.||Clever|Incentives|3d10|3|Ranged|20|||3|d10
Psyspikes|Ranged(10ft)|Normal|Special|At-Will|1|d4|-2|Psyspikes has -2 during Accuracy Check. Psyspikes is a Scatter attack. Up to 5 attacks.||||1d4|0|Ranged|10|||1|d4
Psystrike|Ranged(20ft)|Psychic|Special|1/day|5|d12||Psystrike’s Accuracy Check is made against the target’s Defense.||Clever|Incentives|5d12|1|Ranged|20|||5|d12
Pulverizing Pancake|Melee|Normal|Attack|1/day|10|d12||Immediately move next to your target, then roll your accuracy check.||||10d12|1|Melee||||10|d12
Punishment|Melee|Dark|Attack|3/day|2|d10||Punishment deals an additional 1d10 damage for each Stat Passive the target has.||Clever|Catching Up|2d10|3|Melee||||2|d10
Purify|Melee|Poison|Effect|3/day||||Target an ally or yourself. Target is cured of Poison and Toxin, then if they were cured of Poison or Toxin they are healed 1d20 HP.||Clever|Incredible||3|Melee|||||
Pursuit|Melee|Dark|Attack|At-Will|2|d6||Pursuit deals +6 damage to a target if they moved away from you during their last action.||Clever|Good Show!|2d6|0|Melee||||2|d6
Pyro Ball|Melee|Fire|Attack|1/day|5|d12|-2|Pyro Ball has -2 during Accuracy Check. On hit, if you got 18 or higher on Accuracy Check, the target is Burned.||Beauty|Torrential Appeal|5d12|1|Melee||||5|d12
Quash|Melee|Dark|Effect|3/day||||On hit, the target will act last during each round for two mins. Its Speed is unaffected.||Clever|Quick Set||3|Melee|||||
Quick Attack|Melee|Normal|Attack|At-Will|2|d6||Quick Attack has Priority.||Cool|Quick Set|2d6|0|Melee||||2|d6
Rage|Melee|Normal|Attack|At-Will|2|d6||On hit, your Attack is +1 for 10 mins. This effect cannot be stacked.||Cool|Get Ready!|2d6|0|Melee||||2|d6
Rage Fist|Melee|Ghost|Attack|3/day|1|d8||Rage Fist deals+1d8 damage for each time you have been hit during thisencounter by an attack that dealt damage (max +7d8).||Tough|Round Ender|1d8|3|Melee||||1|d8
Rage Powder|Ranged(10ft)|Bug|Effect|3/day||||Rage Powder is used as a Reaction. If an ally would be attacked, you may target the attacking enemy and they will only want to attack you instead, for 2 mins.||Clever|Scrambler||3|Ranged|10||||
Raging Bull|Melee|Normal|Attack|3/day|3|d10||Destroy any Walls within 5 ft. You may target Walls with Raging Bull without needing to roll Accuracy Check or damage.||||3d10|3|Melee||||3|d10
Raging Fury|Melee|Fire|Attack|3/day|1|d8||For each time you’ve successfully used Raging Fury against the same target during the encounter, add 1d8 to Raging Fury’s damage. Foes deal an additional 1d8 to you with attacks if you have used Raging Fury in the last minute.||||1d8|3|Melee||||1|d8
Rain Dance|Field|Water|Effect|3/day||||You create a circle of Raining Weather with a 60ft diameter. Within the Raining weather, Water-type attacks deal an additional 8 damage and Fire-type attacks deal 8 less damage. This weather disappears after 2 mins.||Tough|Hold That Thought||3|Field|||||
Rapid Spin|Melee|Normal|Attack|At-Will|1|d8||Destroy any Hazards or Coats, and free bound allies within 5 ft. You may target Hazards, Coats, or bound allies with Rapid Spin without needing to roll Accuracy Check or damage.||Cool|Round Starter|1d8|0|Melee||||1|d8
Razor Leaf|Ranged(25ft)|Grass|Attack|At-Will|2|d8||On hit, if you got 18 or higher on Accuracy Check, Razor Leaf is a critical hit.||Cool|Appeal|2d8|0|Ranged|25|||2|d8
Razor Shell|Melee|Water|Attack|3/day|3|d8||On hit, the target’s Defense is -1 for 10 mins. This effect cannot be stacked.||Cool|Appeal|3d8|3|Melee||||3|d8
Razor Wind|Ranged(30ft, 10ft wave)|Normal|Attack|3/day|3|d10||Razor Wind is a two-turn move. On the first turn, do nothing. On the second turn, you may roll Razor Wind’s Accuracy Check and damage. On hit, if you got 18 or more on Accuracy Check, Razor Wind is a critical hit.||Cool|Special Attention|3d10|3|Ranged|30|wave|10|3|d10
Recover|Self|Normal|Effect|1/day||||You are healed HP equal to half of your Max HP.||Clever|Reflective Appeal||1|Self|||||
Reflect|Melee|Psychic|Effect|3/day||||Put a Reflect Coat on the target or yourself. The Coat has the following ability: Reduce damage from attacks that use the attack stat that hit you by 10. This Coat lasts for 2 mins.||Clever|Excitement||3|Melee|||||
Reflect Type|Ranged(30ft)|Normal|Effect|At-Will||||Your Type changes to any one type that the target is. This effect lasts for 10 mins.||Beauty|Attention Grabber||0|Ranged|30||||
Refresh|Melee|Normal|Effect|3/day||||Target an ally or yourself. Target is cured of all afflictions.||Cute|Reflective Appeal||3|Melee|||||
Relic Song|Ranged(20ft burst)|Normal|Special|At-Will|3|d8||On hit, if you got 18 or higher on Accuracy Check, all targets are put to Sleep. On hit or miss, Meloetta may change from Aria Form to Pirouette Form, or back from Pirouette Form to Aria Form.||||3d8|0|Ranged|20|burst||3|d8
Rest|Self|Psychic|Effect|1/day||||You may fall Asleep. If you do, you recover your HP to Max HP and are cured of all afflictions. You cannot attempt to wake up or be awoken naturally for 3 rounds||Cute|Reflective Appeal||1|Self|||||
Retaliate|Melee|Normal|Attack|1/day|1|d12||If the target knocked out an ally during this round, Retaliate has 5d12 for damage instead.||Cool|Appeal|1d12|1|Melee||||1|d12
Return|Melee|Normal|Attack|3/day|3|d10||Return can only be used if you have 3 or more loyalty.||Cute|Round Starter|3d10|3|Melee||||3|d10
Revelation Dance|Ranged(10ft burst)|(Variable)|Special|1/day|3|d12||This attack’s type is dependent on your primary type.||Cute|Attention Grabber|3d12|1|Ranged|10|burst||3|d12
Revenge|Melee|Fighting|Attack|3/day|3|d8||If you were attacked by the target this round, use 3d12 for damage instead.||Tough|Final Appeal|3d8|3|Melee||||3|d8
Reversal|Melee|Fighting|Attack|1/day|1|d10||If you are at less than half of your Max HP, Reversal has 1d20 for damage instead. If you are at less than 5 HP, Reversal has 5d12 for damage instead.||Cool|Final Appeal|1d10|1|Melee||||1|d10
Revival Blessing|Melee|Normal|Effect|1/day||||Target ally at 0 or less HP is healed to half Max HP.||Cute|Final Appeal||1|Melee|||||
Rising Voltage|Ranged(30ft)|Electric|Special|1/day|3|d12||If you are within Electric Terrain while using Rising Voltage, it deals +2d12 damage on hit.||Cool|Torrential Appeal|3d12|1|Ranged|30|||3|d12
Roar|Ranged(30ft burst)|Normal|Effect|1/day||||On hit, Pokémon that are smaller than you will not want to fight and will attempt to run away from you.||Cool|Excitement||1|Ranged|30|burst|||
Roar of Time|Ranged(80ft burst)|Dragon|Special|3/day|5|d20||You cannot act during the next round.||||5d20|3|Ranged|80|burst||5|d20
Rock Blast|Ranged(10ft)|Rock|Attack|At-Will|1|d4|-2|Rock Blast has -2 during Accuracy Check. Rock Blast is a Scatter attack. Up to 5 attacks.||Tough|Reliable|1d4|0|Ranged|10|||1|d4
Rock Climb|Melee|Normal|Attack|3/day|3|d10||On hit, if you got 16 or higher on Accuracy Check, the target is Confused.||Cool|Round Ender|3d10|3|Melee||||3|d10
Rock Slide|Ranged(20ft, 10ft wave)|Rock|Attack|1/day|5|d12|-2|Rock Slide has -2 during Accuracy Check. On hit, if you got 14 or higher on Accuracy Check, the target is Stunned.||Tough|Appeal|5d12|1|Ranged|20|wave|10|5|d12
Rock Smash|Melee|Fighting|Attack|At-Will|2|d6||On hit, the target’s Defense is -1 for 10 mins. This effect cannot be stacked.||Tough|Round Ender|2d6|0|Melee||||2|d6
Rock Throw|Ranged(20ft)|Rock|Attack|At-Will|2|d6||||Tough|Appeal|2d6|0|Ranged|20|||2|d6
Rock Tomb|Ranged(15ft)|Rock|Attack|3/day|3|d8||On hit, the target’s Speed is -1 for 10 mins. This effect cannot be stacked.||Clever|Slow Set|3d8|3|Ranged|15|||3|d8
Rock Wrecker|Ranged(25ft, 10ft blast)|Rock|Attack|1/day|5|d20|-2|Rock Wrecker has a recharge turn and -2 during Accuracy Check.||Tough|Seen Nothing Yet|5d20|1|Ranged|25|blast|10|5|d20
Rolling Kick|Melee|Fighting|Attack|3/day|3|d8||On hit, if you got 14 or higher on Accuracy Check, the target is Stunned.||Cool|Appeal|3d8|3|Melee||||3|d8
Rollout|Melee|Rock|Attack|At-Will|1|d6||For each time you've successfully used Rollout against the same target during the encounter, add 1d6 to Rollout's damage.||Tough|Reliable|1d6|0|Melee||||1|d6
Roost|Self|Flying|Effect|1/day||||You must be on the ground to use Roost. You are healed HP equal to half of your Max HP.||Cool|Torrential Appeal||1|Self|||||
Round|Ranged(15ft burst)|Normal|Special|3/day|3|d8||For every time anyone has used Round before you during this round of combat, Round deals +1d10 damage.||Tough|Reliable|3d8|3|Ranged|15|burst||3|d8
Ruination|Ranged(25ft)|Dark|Special|1/day||||"On hit,the target’s current HP is halved"|||||1|Ranged|25||||
Sacred Fire|Ranged(40ft, 25ft blast)|Fire|Attack|3/day|5|d20||On hit, all targets are Burned.||||5d20|3|Ranged|40|blast|25|5|d20
Sacred Sword|Melee|Fighting|Attack|3/day|3|d10|2|Sacred Sword has +2 during Accuracy Check.||Cool|Appeal|3d10|3|Melee||||3|d10
Safeguard|Ranged(10ft burst)|Normal|Effect|1/day||||Put a Safe Coat on all allies and yourself. The Coat has the following ability: You cannot become afflicted. This Coat lasts for 2 mins.||Beauty|Hold That Thought||1|Ranged|10|burst|||
Salt Cure|Ranged(10ft)|Rock|Effect|1/day||||On hit, the target gets a Salt Coat. The Coat has the following ability: At the beginning of your turn, you lose 1d6 HP. If you areSteel-type or Water-type, you lose 2d6 HP instead. ThisCoat lasts for 3 mins, or until you are at 0 or less HP.||Clever|Torrential Appeal||1|Ranged|10||||
Sand Attack|Ranged(10ft)|Ground|Effect|At-Will||||On hit, the target’s Accuracy Checks are -1 during their next turn. This effect cannot be stacked.||Cute|Excitement||0|Ranged|10||||
Sand Tomb|Ranged(10ft)|Ground|Attack|3/day|1|d4||On hit, the target is bound in place for 1d4 rounds. For each round the target is bound, it takes 1d4 damage on its turns.|Groundshaper|Clever|Torrential Appeal|1d4|3|Ranged|10|||1|d4
Sandstorm|Field|Rock|Effect|3/day||||You create a circle of Sand-storming Weather with a 60ft diameter. Anyone who acts within the Sandstorming weather takes 2d4 damage after acting unless they are Rock-type, Ground-type, or Steel-type. This weather disappears after 2 mins.||Tough|Hold That Thought||3|Field|||||
Savage Spin Out|Melee(25ft burst)|Bug|(Variable)|1/day|8|d12||Immediately move next to your target, then roll your accuracy check.||||8d12|1|Melee|25|burst||8|d12
Scald|Ranged(10ft)|Water|Special|3/day|3|d10||On hit, if you got 14 or higher on Accuracy Check, the target is Burned.|Fountain|Clever|Appeal|3d10|3|Ranged|10|||3|d10
Scale Shot|Ranged(10ft)|Dragon|Attack|At-Will|1|d4|-2|Scale Shot has -2 during Accuracy Check. Scale Shot is a Scatter attack. Up to 5 attacks.||Beauty|Reliable|1d4|0|Ranged|10|||1|d4
Scorching Sands|Ranged(10ft)|Ground|Special|3/day|3|d10||On hit, if you got 14 or higher on Accuracy Check, the target is Burned.||Cute|Appeal|3d10|3|Ranged|10|||3|d10
Scratch|Melee|Normal|Attack|At-Will|2|d6||||Tough|Appeal|2d6|0|Melee||||2|d6
Secret Sword|Melee|Fighting|Special|3/day|3|d10||Secret Sword’s Accuracy Check is made against the target’s Defense.||Cool|Appeal|3d10|3|Melee||||3|d10
Seed Bomb|Ranged(15ft)|Grass|Attack|3/day|3|d10||||Clever|Appeal|3d10|3|Ranged|15|||3|d10
Seed Flare|Ranged(30ft, 10ft blast)|Grass|Special|3/day|5|d20||On hit, all target's Special Defense is -5 for 10 mins.||||5d20|3|Ranged|30|blast|10|5|d20
Seismic Toss|Melee|Fighting|Attack|3/day||||On hit, the target is moved 10ft then loses exactly 25 HP.||Tough|Appeal||3|Melee|||||
Self-Destruct|Ranged(30ft burst)|Normal|Attack|1/day|7|d20||Set your HP to 0, then roll 1d20. On 10 or less, your HP is set to -100% HP and you must make a death savings throw.||Beauty|Big Show|7d20|1|Ranged|30|burst||7|d20
Shadow Ball|Ranged(20ft)|Ghost|Special|3/day|3|d10||On hit, the target’s Special Defense is -1 for 10 mins. This effect cannot be stacked.||Clever|Round Starter|3d10|3|Ranged|20|||3|d10
Shadow Bone|Melee|Ghost|Attack|3/day|3|d10||On hit, the target’s Defense is -1 for 10 mins. This effect cannot be stacked.||Tough|Round Ender|3d10|3|Melee||||3|d10
Shadow Claw|Melee|Ghost|Attack|3/day|3|d8||On hit, if you got 18 or higher on Accuracy Check, Shadow Claw is a critical hit.||Cute|Round Starter|3d8|3|Melee||||3|d8
Shadow Force|Ranged(20ft burst)|Ghost|Attack|3/day|5|d12||When you use this attack, you vanish, then you immediately end your turn. During your next turn, you reappear, your movement speed is doubled and you may roll Shadow Force’s Accuracy Check and damage. Priority attacks cannot be used out of turn order while Shadow Force is being used.||||5d12|3|Ranged|20|burst||5|d12
Shadow Punch|Melee|Ghost|Attack|3/day|3|d8||You can’t miss targets with less than 15 Defense.||Clever|Round Starter|3d8|3|Melee||||3|d8
Shadow Rush|Melee|Shadow|Attack or Special|3/day|3|d10||When using Shadow Rush choose whether you will use your Attack or Special Attack. Shadow Rush’s type is Shadow which always deals damage neutrally to any target. Shadow Rush has –2 during Accuracy Check.||||3d10|3|Melee||||3|d10
Shadow Sneak|Melee|Ghost|Attack|At-Will|2|d6||Shadow Sneak has Priority.||Clever|Quick Set|2d6|0|Melee||||2|d6
Shadow Tag|Ranged(10ft)|Psychic|Effect|1/day||||On hit, the target is bound in place for 2 mins. Ghost Pokémon are immune to Shadow Tag.||Clever|Hold That Thought||1|Ranged|10||||
Shattered Psyche|Ranged(60ft, 20ft blast)|Psychic|(Variable)|1/day|8|d12||||||8d12|1|Ranged|60|blast|20|8|d12
Shed Tail|Self|Normal|Effect|1/day||||Shed Tail is used as a Reaction. If you would be hit by an attack that would dealmore than 1/3rd of your Max HP in damage, use Shed Tailto instead ignore the damage and effects of the attack,but also lose HP equal to 1/3rd of your Max HP. Then,move up to 40 ft.||Clever|Catching Up||1|Self|||||
Sheer Cold|Ranged(15ft, 10ft wave)|Ice|Special|1/day||||On hit, roll 1d20. On a natural result of 17, 18, 19, or 20, the target is set to 0 HP.|Freezer|Beauty|Big Show||1|Ranged|15|wave|10||
Shell Side Arm|Ranged(20ft)|Poison|(Variable)|3/day|3|d10||Shell Side Arm's Accuracy Check is made against the target's Defense or Special Defense and Shell Side Arm's Accuracy Check is made with your Attack or Special Attack, both chosen before Accuracy Check. On hit, if you got 18 or higher on Accuracy Check, the target is Poisoned.||Cool|Appeal|3d10|3|Ranged|20|||3|d10
Shell Smash|Self|Normal|Effect|1/day||||As a free action, your Defense and Special Defense are -3, then your Attack, Special Attack and Speed are +3 for 10 mins. This effect cannot be stacked.||Tough|Get Ready!||1|Self|||||
Shell Trap|Self|Fire|Effect|1/day||||Shell Trap is used as a Reaction. If you would be hit by a melee attack, use Shell Trap to make the attacker take 3d12 Fire-type Special Attack damage after you take the damage and any effects of the triggering attack. You do not need to roll an accuracy check to hit the offender, and they take the damage from Shell Trap even if their attack knocks you out or otherwise prevents you from acting.||Cool|Hold That Thought||1|Self|||||
Shield Protect|Self|Normal|Effect|3/day||||Shield Protect is used as a Reaction. If you are hit by an attack, ignore the damage and any effects of the attack.|||||3|Self|||||
Shock Wave|Ranged(20ft)|Electric|Special|3/day|3|d8||You can’t miss targets with less than 15 Special Defense.|Zapper|Cool|Round Starter|3d8|3|Ranged|20|||3|d8
Shore Up|Self|Ground|Effect|1/day||||You are healed HP equal to half of the target's Max HP. If you are within Sandstorming Weather, you are healed HP equal to 3/4ths of your Max HP instead.||Beauty|Reflective Appeal||1|Self|||||
Signal Beam|Ranged(15ft beam)|Bug|Special|3/day|3|d10||On hit, if you got 18 or higher on Accuracy Check, the target is Confused.||Beauty|Incentives|3d10|3|Ranged|15|beam||3|d10
Signature Move|Ranged(20ft)|(Variable)|(Variable)|3/day|3|d10||||(Variable)|(Variable)|3d10|3|Ranged|20|||3|d10
Silk Trap|Self|Bug|Effect|1/day||||Silk Trap is used as a Reaction. If you would be hit by an attack, use Silk Trap to instead ignore the damage and any effects of the attack. Also, if the ignored attack was a melee attack, the attacker’s Speed is –2 for 10 mins.||Clever|Hold That Thought||1|Self|||||
Silver Wind|Ranged(10ft)|Bug|Special|1/day|2|d8||On hit, your Attack, Special Attack, Defense, Special Defense, and Speed are each raised +1 for 1 hour.||Beauty|Incentives|2d8|1|Ranged|10|||2|d8
Sing|Ranged(30ft burst)|Normal|Effect|1/day|||-8|Sing has -8 during Accuracy Check. On hit, all targets fall Asleep.||Cute|Excitement||1|Ranged|30|burst|||
Sinister Arrow Raid|Ranged(100ft, 30ft blast)|Ghost|Special|1/day|8|d12||||||8d12|1|Ranged|100|blast|30|8|d12
Sketch|Ranged(25ft)|Normal|Effect|1/day||||You permanently learn the target's last-used move. If Sketch is used to learn a Move when you already know 6 Moves, the new move replaces Sketch.||Clever|Catching Up||1|Ranged|25||||
Skitter Smack|Melee|Bug|Attack|3/day|3|d8||On hit, the target’s Special Attack is -1 for 10 mins. This effect cannot be stacked.||Cute|Appeal|3d8|3|Melee||||3|d8
Skull Bash|Melee|Normal|Attack|1/day|5|d12||Skull Bash is a two-turn move. On the first turn: Your Defense is increased to 15 until your next turn (do not decrease it if it is higher). On the second turn, move up to twice your movement speed, then roll Skull Bash’s Accuracy Check and damage.||Tough|Special Attention|5d12|1|Melee||||5|d12
Sky Attack|Melee|Flying|Attack|1/day|5|d12||" Sky Attack is a two-turn move. On the first turn, fly up to 40 ft straight up. On the second turn, fly up to three times your movement speed, then you can roll Sky Attack’s Accuracy Check and damage."||Tough|Special Attention|5d12|1|Melee||||5|d12
Sky Drop|Melee|Flying|Attack|1/day|3|d12||Sky Drop is a two-turn move. On the first turn, an adjacent character is bound to you, then you fly up to 40 ft straight up; they can’t use ranged moves until your next turn. On the second turn, you both return to the ground, they are no longer bound to you, and you can roll Sky Drop’s Accuracy Check and damage.||Clever|Special Attention|3d12|1|Melee||||3|d12
Sky Uppercut|Melee|Fighting|Attack|3/day|3|d10||You may leap up to 60ft upwards to hit a target while using Sky Uppercut.||Cool|Round Starter|3d10|3|Melee||||3|d10
Slack Off|Self|Normal|Effect|1/day||||You are healed HP equal to half of your Max HP.||Cute|Reflective Appeal||1|Self|||||
Slam|Melee|Normal|Attack|3/day|3|d10|-2|Slam has -2 during Accuracy Check.||Tough|Appeal|3d10|3|Melee||||3|d10
Slash|Melee|Normal|Attack|3/day|3|d8||On hit, if you got 18 or higher on Accuracy Check, Slash is a critical hit.||Cool|Appeal|3d8|3|Melee||||3|d8
Sleep Dust|Melee|Grass|Effect|3/day||||On hit, the target is put to Sleep.|||||3|Melee|||||
Sleep Gas|Ranged(15ft, 10ft burst)|Grass|Effect|3/day|||-2|Sleep Gas has -2 during Accuracy Check. On hit, the target is put to Sleep.|||||3|Ranged|15|burst|10||
Sleep Powder|Melee|Grass|Effect|At-Will|||-5|Sleep Powder has -5 during Accuracy Check. On hit, the target is put to Sleep.||Clever|Inversed Appeal||0|Melee|||||
Sleep Talk|Self|Normal|Effect|3/day||||Sleep Talk may only be used while you are Asleep. You randomly use another move that you know. You may move at half speed while using Sleep Talk.||Cute|Appeal||3|Self|||||
Slippin Slide|Melee|Normal|Attack|At-Will|1|d6||If you are in water, Raining terrain, or Tide terrain, Slippin Slide deals +1d6 damage.|Loses Beached and Flopper|||1d6|0|Melee||||1|d6
Sludge|Ranged(15ft)|Poison|Special|3/day|3|d8||On hit, if you got 14 or higher on Accuracy Check, the target is Poisoned.|Repulsive|Cool|Appeal|3d8|3|Ranged|15|||3|d8
Sludge Bomb|Ranged(25ft, 5ft blast)|Poison|Special|1/day|3|d12||On hit, if you got 14 or higher on Accuracy Check, all targets are Poisoned.|Repulsive|Tough|Round Ender|3d12|1|Ranged|25|blast|5|3|d12
Sludge Wave|Ranged(20ft, 10ft wave)|Poison|Special|1/day|3|d12||On hit, if you got 18 or higher on Accuracy Check, all targets are Poisoned.|Repulsive|Cool|Appeal|3d12|1|Ranged|20|wave|10|3|d12
Smack Down|Ranged(25ft)|Rock|Attack|3/day|1|d12||On hit, Smack Down knocks the target out of the air, removing any Ground-type immunities and disabling the target’s ability to move in the air for 2 mins.||Tough|Appeal|1d12|3|Ranged|25|||1|d12
Smart Strike|Melee|Steel|Attack|3/day|3|d8||You can’t miss targets with less than 15 Defense.||Clever|Inversed Appeal|3d8|3|Melee||||3|d8
Smelling Salt|Melee|Normal|Attack|3/day|3|d8||If Smelling Salt is used against a Paralyzed target, Smelling Salt deals 5d8 for damage instead, then cures the target of Paralysis. If you choose not to roll damage while using Smelling Salt, you do not need to roll an Accuracy Check.||Clever|Unsettling|3d8|3|Melee||||3|d8
Smite|Ranged(20ft)|Normal|Special|3/day|3|d8||Smite uses your Defense or Speed modifier during accuracy check and damage. Smite cannot be resisted, nor can a target be immune to it.||||3d8|3|Ranged|20|||3|d8
Smog|Ranged(5ft)|Poison|Special|At-Will|1|d4||On hit, if you got 13 or higher on Accuracy Check, the target is Poisoned.|Repulsive|Tough|Appeal|1d4|0|Ranged|5|||1|d4
Smokescreen|Ranged(10ft)|Normal|Effect|3/day||||Place up to 25 contiguous ft of Smoke Screen Wall. Smoke Screen Wall has not thickness, is 12 ft tall and has the following ability: Attacks that target through or within the wall have -2 during Accuracy Check. This Wall disappears after 2 mins.||Clever|Unsettling||3|Ranged|10||||
Snap Trap|Melee|Grass|Attack|3/day|2|d6||On hit, the target is bound to you for 1 min.||Cute|Unsettling|2d6|3|Melee||||2|d6
Snarl|Melee(5ft burst)|Dark|Special|At-Will|1|d8||On hit, the target’s Special Attack is -1 for 10 mins. This effect cannot be stacked.||Tough|Incentives|1d8|0|Melee|5|burst||1|d8
Snipe Shot|Ranged(40ft)|Water|Special|3/day|3|d10||Snipe Shot cannot be redirected by passives or any other ability, instead only hitting a target it was directed at.||Cool|Incredible|3d10|3|Ranged|40|||3|d10
Snore|Melee|Normal|Special|At-Will|1|d12||Snore can only be used while you’re Asleep. You may move at half of your normal Speed if you use Snore during your action. On hit, if you got 16 or higher on Accuracy Check, the target is Stunned.||Cute|Appeal|1d12|0|Melee||||1|d12
Snowscape|Field|Ice|Effect|3/day||||You create a circle of Snowing Weather with a 60ft diameter. Any Ice Types within Snowing Weather have +2 Defense. Pokémon who benefit from Hailing weather with passives or the effect of moves they use also benefit from those effects in Snowing Weather. This weather disappears after 2 mins.|||||3|Field|||||
Soak|Melee|Water|Effect|3/day||||On hit, put a Soak Coat on the target. The Coat has the following ability: You lose your current Types and become only Water-type for 10 mins.|Fountain|Beauty|Torrential Appeal||3|Melee|||||
Soft Song|Ranged(10ft)|Normal|Effect|1/day|||-4|Soft Song has -4 during Accuracy Check. On hit, the target falls Asleep. If the target is Sleeping, you wake them instead.|||||1|Ranged|10||||
Softboiled|Melee|Normal|Effect|1/day||||Target an ally or yourself. The target is healed HP equal to half of the target's Max HP.||Cute|Reflective Appeal||1|Melee|||||
Solar Beam|Ranged(30ft beam)|Grass|Special|1/day|5|d12||Solar Beam is a two-turn move unless it is Sunny. On the first turn, do nothing. On the second turn or if it is Sunny, roll Solar Beam’s Accuracy Check and damage.||Cool|Special Attention|5d12|1|Ranged|30|beam||5|d12
Solar Blade|Melee|Grass|Attack|1/day|5|d12||Solar Blade is a two-turn move unless it is Sunny. On the first turn, do nothing. On the second turn or if it is Sunny, move up to twice your movement speed, then roll Solar Blade’s Accuracy Check and damage||Cool|Special Attention|5d12|1|Melee||||5|d12
Sonic Boom|Ranged(5ft)|Normal|Special|At-Will|10|||Do not add bonuses of any kind to this damage||Cool|Appeal|10|0|Ranged|5|||10|
Spacial Rend|Ranged(40ft, 10ft blast)|Dragon|Special|3/day|5|d12||On hit, if you got 14 or higher on Accuracy Check, Spatial Rend is a critical hit.||||5d12|3|Ranged|40|blast|10|5|d12
Spark|Melee|Electric|Attack|3/day|3|d8||On hit, if you got 14 or higher on Accuracy Check, the target is Paralyzed.|Zapper|Cool|Appeal|3d8|3|Melee||||3|d8
Sparkling Aria|Ranged(20ft burst)|Water|Special|1/day|3|d12||Sparkling Aria cures any ally’s Burns within range without damaging them.||Beauty|Round Starter|3d12|1|Ranged|20|burst||3|d12
Spectral Thief|Melee|Ghost|Attack|3/day|5|d8||On hit, your target's stat passives are disabled. For the next ten minutes, you gain those passives. You may have any amount of stat passives through your uses of Spectral Thief.||||5d8|3|Melee||||5|d8
Spicy Extract|Melee|Grass|Effect|3/day||||Target an ally, afoe, or yourself. The target’s Attack is +3 and the target’s Defense is -3 for 10 mins. Spicy Extract cannot miss.||Cool|Special Attention||3|Melee|||||
Spider Web|Ranged(20ft)|Bug|Effect|1/day||||On hit, the target is bound in place for 1d6 turns.|Threaded|Clever|Hold That Thought||1|Ranged|20||||
Spider Webbing|Ranged(20ft, 10ft burst)|Bug|Effect|3/day||||On hit, the target is bound in place for 1d6 turns.|||||3|Ranged|20|burst|10||
Spike Cannon|Ranged(10ft)|Normal|Attack|At-Will|1|d4|-2|Spike Cannon has -2 during Accuracy Check. Spike Cannon is a Scatter attack. Up to 5 attacks.||Cool|Reliable|1d4|0|Ranged|10|||1|d4
Spikes|Ranged(20ft burst)|Ground|Effect|3/day||||Place the Spikes Hazard in the area surrounding you. Spikes Hazard has the following ability: When a foe moves through Spikes Hazard during their turn and are on the ground, they lose 1/6th of their Max HP. This Hazard disappears after 2 mins.||Clever|Hold That Thought||3|Ranged|20|burst|||
Spiky Shield|Self|Grass|Effect|1/day||||Spiky Shield is used as a Reaction. If an enemy within melee range would hit you with an attack, use Spiky Shield to instead ignore the damage and any effects of the Fire-type attack, and also the enemy loses HP equal to 1/6th of its Max HP.||Cute|Inversed Appeal||1|Self|||||
Spin Out|Melee|Steel|Attack|1/day|3|d12||On hit, yourSpeed is -2 for 10 mins.||Cool|Unsettling|3d12|1|Melee||||3|d12
Spirit Break|Melee|Fairy|Attack|3/day|3|d10||On hit, the target's Special Attack is -1 for 10 mins. This effect cannot be stacked.||Tough|Unsettling|3d10|3|Melee||||3|d10
Spirit Shackle|Ranged(25ft)|Ghost|Special|3/day|3|d10||On hit, the target is bound to the ground for 1d6 rounds.||Beauty|Unsettling|3d10|3|Ranged|25|||3|d10
Spit Up|Ranged(15ft)|Normal|Special|1/day||||Destroy up to 3 of your Coats of Stuff. For every Coat of Stuff you destroy, Spit Up deals an additional 2d10 damage.||Tough|Round Ender||1|Ranged|15||||
Splash|Melee|Normal|Effect|At-Will||||Instead of making an Accuracy Check, roll 1d20. On 18 or higher, all adjacent foes are moved 5 ft away from the user.||Cute|Inversed Appeal||0|Melee|||||
Splintered Stormshards|Ranged(60ft, 20ft blast)|Rock|Attack|1/day|8|d12||Remove any weather or field effects from the field.||||8d12|1|Ranged|60|blast|20|8|d12
Spook|Melee|Ghost|Attack|At-Will|2|d6||||||2d6|0|Melee||||2|d6
Spore|Melee|Grass|Effect|1/day||||On hit, the target is put to Sleep.||Beauty|Get Ready!||1|Melee|||||
Stampede|Melee|Normal|Attack|1/day|3|d12||Stampede can only be made against enemies that you passed through while moving during your turn. While moving with Stampede, it rolls an accuracy check to hit every foe you and any allied mounted Pokémon moves through with you. Stampede deals +1d12 damage for every allied mounted Pokémon that is moving with you. If all mounted Pokémon moving with Stampede share a type, Stampede's type may be changed from Normal to that type. If you or any allied mounted Pokémon were, they are no longer bound. Any Pokémon involved in making this attack may still use a move during their turn.||||3d12|1|Melee||||3|d12
Stealth Rock|Ranged(5ft)|Rock|Effect|3/day||||Place a Stealth Rock Hazard adjacent to you. Stealth Rock Hazard has the fol-lowing ability: If a foe moves within 20 ft of Stealth Rock Hazard, it will hurl itself at the foe, destroying itself and dealing 2d12 Rock-type damage to the foe without needing an Accuracy Check.||Cool|Hold That Thought||3|Ranged|5||||
Steam Eruption|Ranged(20ft burst)|Water|Special|3/day|5|d12||On hit, if you got 14 or higher on Accuracy Check, all targets are Burned.||||5d12|3|Ranged|20|burst||5|d12
Steamroller|Melee|Bug|Attack|At-Will|2|d8||On hit, if you got 18 or higher on Accuracy Check, the target is Stunned.||Tough|Appeal|2d8|0|Melee||||2|d8
Steel Beam|Ranged(30ft)|Steel|Special|1/day|7|d12||On hit, you lose HP equal to half of the damage you deal.||Clever|Seen Nothing Yet|7d12|1|Ranged|30|||7|d12
Steel Roller|Melee|Steel|Attack|1/day|5|d12||Steel Roller can only be used if you are in the area of a Terrain move, and destroys that Terrain when used.||Clever|Unsettling|5d12|1|Melee||||5|d12
Steel Strike|Melee|Steel|Attack|At-Will|2|d6||||||2d6|0|Melee||||2|d6
Steel Wing|Melee|Steel|Attack|At-Will|2|d8||On hit, the target’s Defense is -1 for 10 mins. This effect cannot be stacked.||Cool|Appeal|2d8|0|Melee||||2|d8
Sticky Web|Ranged(25ft burst)|Bug|Effect|3/day||||Place the Sticky Web Hazard in the area surrounding you. Sticky Wed Hazard has the following ability: Foes moving through Sticky Web Hazard on the ground have -25ft movement per turn, to a minimum of 5ft. This Hazard disappears after 2 mins.||Clever|Hold That Thought||3|Ranged|25|burst|||
Stockpile|Self|Normal|Effect|At-Will||||Put a Stuff Coat on yourself, unless you already have 3 Coats of Stuff. The Coat has the following ability: Your Defense and Special Defense are +1 if you have 1 or 2 Coats of Stuff. If you have 3 Coats of Stuff, your Defense and Special Defense are +2. These Coats last for 2 mins.|Inflatable|Tough|Round Ender||0|Self|||||
Stoked Sparksurfer|Ranged(100ft)|Electric|Special|1/day|8|d12||On hit, the target is Paralyzed.||||8d12|1|Ranged|100|||8|d12
Stomp|Melee|Normal|Attack|At-Will|2|d8||On hit, if you got 18 or higher on Accuracy Check, the target is Stunned.||Tough|Appeal|2d8|0|Melee||||2|d8
Stomping Tantrum|Melee|Ground|Attack|1/day|3|d12||If you missed with your last attack during the last round, Stomping Tantrum has 5d12 for damage instead.|Groundshaper|Tough|Round Ender|3d12|1|Melee||||3|d12
Stone Axe|Melee|Rock|Attack|3/day|3|d8||On hit, the target gains a Splinters Coat unless it already has one. The coat has the following ability: After acting, roll 1d20; on a result of 16 or better, destroy this coat; otherwise, take 2d4 damage. This Coat lasts for 3 mins, or until you are at 0 or less HP.||Cool|Appeal|3d8|3|Melee||||3|d8
Stone Edge|Ranged(25ft)|Rock|Attack|1/day|5|d12|-2|Stone Edge has -2 during Accuracy Check. On hit, if you got 18 or higher on Accuracy Check, Stone Edge is a critical hit.||Tough|Incentives|5d12|1|Ranged|25|||5|d12
Stone Fall|Ranged(35ft)|Rock|Special|1/day|5|d12||On hit, if you got 18 or higher on Accuracy Check, Stone Fall is a critical hit.||||5d12|1|Ranged|35|||5|d12
Stone Smash|Melee|Rock|Attack|At-Will|2|d6||||||2d6|0|Melee||||2|d6
Storm Throw|Melee|Fighting|Attack|3/day|2|d8|-2|Storm Throw has -2 during Accuracy Check. On hit, Storm Throw always counts as a critical hit and moves the target 5ft away from you.||Cool|Appeal|2d8|3|Melee||||2|d8
Strange Steam|Ranged(10ft burst)|Fairy|Special|3/day|3|d10||On hit, if you got 16 or higher on Accuracy Check, any targets are Confused.||Cute|Appeal|3d10|3|Ranged|10|burst||3|d10
Strength|Melee|Normal|Attack|3/day|3|d10||On hit, the target is moved 15ft away from you.|Strength|Tough|Appeal|3d10|3|Melee||||3|d10
Strength Sap|Melee|Grass|Effect|1/day||||On hit, you are healed HP equal to the target's Attack stat, then the target’s Attack is -2 for 10 mins. This effect cannot be stacked.||Clever|Inversed Appeal||1|Melee|||||
Struggle|Melee|No-Type|Attack|At-Will|2|d8||Struggle is used if you can't use any other attacks. Struggle has no type. After use, you lose HP equal to 1/4th of your Max HP.||||2d8|0|Melee||||2|d8
Struggle Bug|Ranged(5ft burst)|Bug|Special|At-Will|2|d6||On hit, the target’s Special Attack is -1 for 10 mins. This effect cannot be stacked.||Clever|Excitement|2d6|0|Ranged|5|burst||2|d6
Struggling Bug|Ranged(20ft)|Bug|Special|At-Will|2|d6||||||2d6|0|Ranged|20|||2|d6
Stuff Cheeks|Self|Normal|Effect|At-Will||||"As a free action, consume your held Berry. Your Defense is +2 for 10 mins. "||Cute|Get Ready!||0|Self|||||
Stun Gas|Ranged(15ft, 10ft burst)|Grass|Effect|3/day|||-2|Stun Gas has -2 during Accuracy Check. On hit, the target is Paralyzed.|||||3|Ranged|15|burst|10||
Stun Spore|Melee|Grass|Effect|At-Will|||-5|Stun Spore has -5 during Accuracy Check. On hit, the target is Paralyzed.||Clever|Excitement||0|Melee|||||
Stylish Spin|Ranged(10ft)|Normal|Effect|3/day||||On hit, the target is Confused.|||||3|Ranged|10||||
Submission|Melee|Fighting|Attack|3/day|3|d10||On hit, you lose HP equal to 1/4th of the damage you deal.||Cool|Appeal|3d10|3|Melee||||3|d10
Substitute|Self|Normal|Effect|1/day||||Substitute is used as a Reaction. If you would be hit by an attack that would deal more than 1/6th of your Max HP in damage, use Substitute to instead ignore the damage and effects of the attack, but also lose HP equal to 1/6th of your Max HP.||Clever|Catching Up||1|Self|||||
Subzero Slammer|Ranged(60ft, 20ft blast)|Ice|(Variable)|1/day|8|d12||||||8d12|1|Ranged|60|blast|20|8|d12
Sucker Punch|Melee|Dark|Attack|1/day|3|d8||Sucker Punch is used as a Reaction. When you are a target of a melee move, use Sucker Punch to attack the attacker before the enemy rolls their Accuracy Check against you. You must still roll an accuracy check for Sucker Punch.||Clever|Quick Set|3d8|1|Melee||||3|d8
Sunny Day|Field|Fire|Effect|3/day||||You create a circle of Sunny Weather with a 60ft diameter. Within the Sunny weather, Fire-type attacks deal an additional 8 damage and Water-type attacks deal 8 less damage. This weather disappears after 2 mins.||Beauty|Hold That Thought||3|Field|||||
Sunsteel Strike|Ranged(20ft burst)|Steel|Attack|3/day|5|d20||Sunsteel Strike has +2 during Accuracy Check.||||5d20|3|Ranged|20|burst||5|d20
Super Fang|Melee|Normal|Attack|1/day||||On hit, the target’s current HP is halved.||Tough|Appeal||1|Melee|||||
Superpower|Melee|Fighting|Attack|1/day|5|d12||On hit, your Attack and Defense is -2 for 10 mins. This effect cannot be stacked.||Tough|Round Ender|5d12|1|Melee||||5|d12
Supersonic|Ranged(10ft)|Normal|Effect|At-Will|||-8|Supersonic has -8 during Accuracy Check. On hit, the target is Confused.||Clever|Excitement||0|Ranged|10||||
Supersonic Skystrike|Melee(25ft burst)|Flying|(Variable)|1/day|8|d12||Immediately move next to your target, then roll your accuracy check.||||8d12|1|Melee|25|burst||8|d12
Surf|Ranged(30ft, 10ft wave)|Water|Special|1/day|3|d12||||Beauty|Round Starter|3d12|1|Ranged|30|wave|10|3|d12
Surging Strikes|Melee|Water|Attack|3/day|1|d12||Surging Strikes is a Scatter attack. It has three attacks. On hit, Surging Strikes always counts as a critical hit.||||1d12|3|Melee||||1|d12
Swagger|Ranged(10ft)|Normal|Effect|1/day||||On hit, the target is Confused and the target’s Attack is +4 until they are no longer Confused.||Cute|Excitement||1|Ranged|10||||
Swallow|Self|Normal|Effect|1/day||||Destroy up to 3 of your Coats of Stuff. For every Coat of Stuff you destroy, Swallow heals you 25 HP.||Tough|Reflective Appeal||1|Self|||||
Sweet Kiss|Melee|Normal|Effect|3/day|||-4|Sweet Kiss has -4 during Accuracy Check. On hit, the target is Confused.||Cute|Excitement||3|Melee|||||
Sweet Scent|Ranged(10ft)|Normal|Effect|At-Will||||On hit, your next attack against the same target has +1 during Accuracy Check.|Alluring|Cute|Excitement||0|Ranged|10||||
Swift|Ranged(20ft)|Normal|Special|3/day|3|d8||You can’t miss targets with less than 15 Special Defense.||Cool|Round Starter|3d8|3|Ranged|20|||3|d8
Switcheroo|Melee|Dark|Effect|1/day||||On hit, you and the target trade any held items. If only you or the target has an item, take or give the item to exchange who has possession of it.||Cool|Attention Grabber||1|Melee|||||
Sync Move|Ranged(30ft beam)|No-Type|(Variable)|1/day|3|d12||You can’t miss targets with less than 15 Defense or Special Defense. Sync Move has no type which means it can’t be resisted and can’t be super-effective. However, if both participating attackers share a type, they may have Sync Move’s type be that type and be affected by weakness and resistance. Sync Move checks its accuracy against Defense or Special Defense, decided when declared as an attack. Sync Move’s attackers apply both Attack or both Special Attack modifiers to Sync Move’s damage. Sync Move takes up both attacker’s turns during that round of combat.||||3d12|1|Ranged|30|beam||3|d12
Synchronoise|Ranged(50ft burst)|Psychic|Special|3/day|5|d8||Synchronoise can’t hit targets unless they share at least one type with you.||Clever|Incentives|5d8|3|Ranged|50|burst||5|d8
Synthesis|Self|Grass|Effect|1/day||||You are healed HP equal to half of your Max HP. If you are within Sunny Weather, you are healed HP equal to 3/4ths of your Max HP instead.|Sprouter|Clever|Reflective Appeal||1|Self|||||
Syrup Bomb|Ranged(15ft)|Grass|Special|3/day|3|d10||On hit, the target’s Speed is -1 for 10 mins. This effect cannot be stacked.||||3d10|3|Ranged|15|||3|d10
Tachyon Cutter|Ranged(50ft)|Steel|Special|3/day|2|d12||"Tachyon Cutter cannot miss and does not need a line of sight to target if you are in Electrified terrain. "||||2d12|3|Ranged|50|||2|d12
Tackle|Melee|Normal|Attack|At-Will|2|d6||||Tough|Appeal|2d6|0|Melee||||2|d6
Tail Slap|Melee|Normal|Attack|At-Will|1|d4|-2|Tail Slap has -2 during Accuracy Check. Tail Slap is a Scatter attack. Up to 5 attacks.||Cute|Reliable|1d4|0|Melee||||1|d4
Take Down|Melee|Normal|Attack|3/day|3|d10||On hit, you lose HP equal to 1/4th of the damage you deal.||Tough|Appeal|3d10|3|Melee||||3|d10
Tar Shot|Ranged(20ft)|Rock|Effect|3/day||||Put a Tar Coat on the target. The Coat has the following ability: Your Speed is -2. If you are hit by a Fire-type attack, you take +8 damage. This Coat lasts for 2 mins.||Cool|Round Ender||3|Ranged|20||||
Taunt|Ranged(20ft)|Dark|Effect|3/day||||On hit, the target may only use attacks that target you or your allies for 1 min.||Clever|Inversed Appeal||3|Ranged|20||||
Tea Time|Ranged(40ft burst)|Normal|Effect|3/day||||Any target holding a Berry immediately consumes it.||Cute|Incredible||3|Ranged|40|burst|||
Techno Blast|Ranged(40ft, 20ft blast)|Normal|Special|At-Will|3|d8||Techno Blast’s type can be changed to Ice, Electric, Fire, or Water when used.||||3d8|0|Ranged|40|blast|20|3|d8
Tectonic Rage|Ranged(60ft, 20ft blast)|Ground|(Variable)|1/day|8|d12||||||8d12|1|Ranged|60|blast|20|8|d12
Teeter Dance|Ranged(30ft burst)|Normal|Effect|1/day||||On hit, all targets are Confused.||Cute|Scrambler||1|Ranged|30|burst|||
Teleport|Ranged(50ft)|Psychic|Effect|1/day||||Teleport may be used a Reaction. Teleport moves you up to 50ft away in your line of sight. If an enemy would hit you with a move that deals damage, use Teleport as a Reaction to move up to 50ft away in your line of sight and take only 1/4 the damage you would have taken from the attack.||Cool|Quick Set||1|Ranged|50||||
Ten-Million Volt Thunderbolt|Ranged(100ft)|Electric|Special|1/day|10|d12||On hit, the target is Paralyzed.||||10d12|1|Ranged|100|||10|d12
Tera Blast|Ranged (40ft beam, 10ft blast)|Normal|Special|3/day|3|d12||Tera Blast’s type changes to match your type. When you use Tera Blast, you may use your Attack stat instead of your Special Attack stat when rolling to hit and calculating damage instead.||||3d12|3|"Ranged "|40|beamblast|10|3|d12
Tera Starstorm|Ranged(50ft, 30ft wave)|Normal|Special|3/day|3|d12||||||3d12|3|Ranged|50|wave|30|3|d12
Terrain Pulse|Ranged(25ft)|Normal|Special|3/day|3|d8||If used in the area of a Terrain move, Terrain Pulse has 5d8 for damage instead and its type changes to match the terrain.||Beauty|Incentives|3d8|3|Ranged|25|||3|d8
Terrify|Ranged(25ft)|Ghost|Special|At-Will|1|d12||||||1d12|0|Ranged|25|||1|d12
Thief|Melee|Dark|Attack|3/day|3|d8||On hit, steals the target’s held item, if any.||Cool|Catching Up|3d8|3|Melee||||3|d8
Thousand Arrows|Ranged(40ft)|Ground|Special|3/day|3|d10||Thousand Arrows ignores any Ground-type immunities.||||3d10|3|Ranged|40|||3|d10
Thousand Waves|Ranged(40ft, 10ft wave)|Ground|Attack|3/day|3|d12||On hit, all targets are bound to the ground for 10 mins. Thousand Waves ignores any Ground-type immunities.||||3d12|3|Ranged|40|wave|10|3|d12
Thrash|Melee|Normal|Attack|1/day|5|d12||Thrash is a two turn move. On each turn, move to the closest character within 25 ft that you can reach, and roll this move’s Accuracy Check and damage against them. After your second turn you are Confused.||Tough|Reliable|5d12|1|Melee||||5|d12
Throat Chop|Melee|Dark|Attack|3/day|3|d10||On hit, the target may not use attacks or abilities that require the use of the target's voice.||Tough|Catching Up|3d10|3|Melee||||3|d10
Thunder|Ranged(30ft, 5ft blast)|Electric|Special|1/day|5|d12|-2|Thunder has -2 during Accuracy Check unless it’s Raining. On hit, if you got 14 or higher on Accuracy Check, the targets are Paralyzed.|Zapper|Cool|Round Starter|5d12|1|Ranged|30|blast|5|5|d12
Thunder Cage|Ranged(50ft burst)|Electric|Special|1/day|3|d8||On hit, all targets are bound to ground for 1d4 turns. For each turn the target is bound, it takes 1d6 damage.||||3d8|1|Ranged|50|burst||3|d8
Thunder Fang|Melee|Electric|Attack|3/day|3|d8||On hit, if you got 18 or higher on Accuracy Check, the target is randomly either Stunned or Paralyzed.|Zapper|Clever|Appeal|3d8|3|Melee||||3|d8
Thunder Punch|Melee|Electric|Attack|3/day|3|d8||On hit, if you got 17 or higher on Accuracy Check, the target is Paralyzed.||Cool|Round Starter|3d8|3|Melee||||3|d8
Thunder Shock|Ranged(20ft)|Electric|Special|At-Will|1|d12||On hit, if you got 18 or higher on Accuracy Check, the target is Paralyzed.|Zapper|Cool|Appeal|1d12|0|Ranged|20|||1|d12
Thunder Spark|Ranged(20ft)|Electric|Special|At-Will|1|d12||||||1d12|0|Ranged|20|||1|d12
Thunder Wave|Ranged(20ft)|Electric|Effect|1/day||||On hit, the target is Paralyzed.|Zapper|Cool|Excitement||1|Ranged|20||||
Thunderbolt|Ranged(30ft)|Electric|Special|3/day|3|d10||On hit, if you got 18 or higher on Accuracy Check, the target is Paralyzed.|Zapper|Cool|Round Starter|3d10|3|Ranged|30|||3|d10
Thunderclap|Ranged(40ft)|Electric|Attack|At-Will|2|d10||Thunderclap has Priority in Sunny Weather.||||2d10|0|Ranged|40|||2|d10
Thunderous Kick|Melee|Fighting|Attack|1/day|5|d12||On hit, the target’s Defense is -1 for 10 mins. This effect cannot be stacked.||||5d12|1|Melee||||5|d12
Tidepools|Field|Water|Effect|3/day||||You create a circle of Tide Terrain with a 60ft diameter. Pokémon with the skill Flopper or Beached ignore those skills while acting within Tide Terrain. Tide Terrain does not replace other Terrains nor does it get replaced by other Terrains. This terrain disappears after 5 mins.|Loses Beached/Flopper||||3|Field|||||
Tidy Up|Ranged(30ft burst)|Normal|Effect|3/day||||Any Hazards or Coats within range are destroyed. If you destroyed any Hazards or Coats, your Attack is +1 and your Speed is +1 for 10 mins.||Cute|Excitement||3|Ranged|30|burst|||
Tireless Teleport|Ranged(50ft)|Psychic|Effect|At-Will||||Tireless Teleport is used as a Reaction. If you are hit by an attack, move up to 50ft away in your line of sight. Take only 1/4th the damage you would have taken from the attack.|||||0|Ranged|50||||
Torch Song|Ranged(30ft)|Fire|Special|3/day|3|d10||On hit, your Special Attack is +2 for 10 mins.||Beauty|Incentives|3d10|3|Ranged|30|||3|d10
Totem Memory|" Ranged(25ft burst)"|Normal|Effect|1/day||||" All allies (up to 10 including yourself) within range of Totem Memory have their Attack or Special Attack raised +2 for 10 mins."|||||1|" Ranged"|25|burst|||
Totemic Call|Self|Normal|Effect|At-Will||||" If you have 2 or more allies with you in combat, Totemic Call fails. Summon 1d4 allies to the encounter. The allies who show up have their Attack and Special Attack raised 2 for 10 mins."|||||0|Self|||||
Totemic Guardian|" Ranged(25ft burst)"|Normal|Attack or Special|3/day|3|d8||All allies (up to 10 including yourself) within range of Totemic Guardian are healed HP equal to the amount of damage Totemic Guardian would have dealt.||||3d8|3|" Ranged"|25|burst||3|d8
Totemic Power|Ranged(25ft burst)|Normal|Effect|1/day||||All allies (up to 10 including yourself) within range of Totemic Power have their Attack and Special Attack raised +2 for 10 mins. Totemic Power can stack.|||||1|Ranged|25|burst|||
Toxic|Melee|Poison|Effect|1/day|||-3|Toxic has -3 during Accuracy Check, unless the user is Poison type. On hit, the target is Toxified.||Clever|Excitement||1|Melee|||||
Toxic Spikes|Ranged(20ft burst)|Poison|Effect|3/day||||Place the Toxic Spikes Hazard in the area surrounding you. Toxic Spikes Hazard has the following ability: When a foe moves through Toxic Spikes Hazard during their turn and are on the ground, they are Poisoned. If the Toxic Spikes Hazard has multiple layers, it will Toxify foes instead of Poisoning them instead. This Hazard disappears after 2 mins.||Clever|Hold That Thought||3|Ranged|20|burst|||
Toxic Thread|Ranged(20ft)|Poison|Effect|1/day||||On hit, the target is Poisoned and the target’s Speed is -1 until they are no longer Poisoned.||Clever|Excitement||1|Ranged|20||||
Trailblaze|Melee|Grass|Attack|At-Will|2|d6||On hit, your Speed is +1 for 10 mins.||||2d6|0|Melee||||2|d6
Transform|Ranged(25ft)|Normal|Effect|At-Will||||You transform into a copy of the target changing all of your stats except for HP. You copy its stats, skills, and passives. You can use any of the target’s moves. While transformed, you lose access to your regular moves, skills, passives, and biology. Except for stats, this information is not provided to you. Transform may not target Legendary Pokémon. Transform lasts for 2 hours or until Ditto chooses to change back as an action. Transform fails if used by anything but a Ditto.||Clever|Catching Up||0|Ranged|25||||
Tri Attack|Ranged(20ft)|Normal|Special|3/day|3|d10||On hit, if you got 17 or higher on Accuracy Check, the target is randomly either Paralyzed, Burned, or Frozen.||Beauty|Appeal|3d10|3|Ranged|20|||3|d10
Trick|Melee|Psychic|Effect|1/day||||On hit, you and the target trade any held items. If only you or the target has an item, take or give the item to exchange who has possession of it.|Telekinetic|Clever|Attention Grabber||1|Melee|||||
Trick Room|Field|Psychic|Effect|3/day||||You create a circle of Tricky Terrain with a 60ft diameter. Within the Tricky terrain, turn orders are reversed during each round. If some are outside of Tricky terrain while others are within Tricky terrain, all actions are still made in reverse order. This terrain disappears after 2 mins.||Cute|Scrambler||3|Field|||||
Trick-or-Treat|Melee|Ghost|Effect|3/day||||On hit, put a Treat Coat on the target. The Coat has the following ability: You lose your current Types and become only Ghost-type for 10 mins.||Clever|Torrential Appeal||3|Melee|||||
Triple Arrows|Ranged(30ft)|Fighting|Attack|3/day|1|d12||Triple Arrows is a Scatter attack. Up to 3 attacks. Triple Arrow's third attack on hit deals an additional 1d12 damage. On hit, any target's Defense is -1 for 10 mins. This effect cannot be stacked.||Tough|Reliable|1d12|3|Ranged|30|||1|d12
Triple Axel|Melee|Ice|Attack|3/day|1|d12||Triple Axel is a Scatter attack. Up to 3 attacks. Triple Axel’s last attack on hit deals an additional 1d12 damage.||Beauty|Reliable|1d12|3|Melee||||1|d12
Triple Dive|Melee|Water|Attack|3/day|1|d12||1d20. Triple Dive is a Scatter attack. Up to 3 attacks. Triple Dive’s third attack on hit deals an additional 1d12 damage.||Cute|Reliable|1d12|3|Melee||||1|d12
Triple Kick|Melee|Fighting|Attack|3/day|1|d12||Triple Kick is a Scatter attack. Up to 3 attacks. Triple Kick’s last attack on hit deals an additional 1d12 damage.||Cool|Reliable|1d12|3|Melee||||1|d12
Trop Kick|Melee|Grass|Attack|3/day|3|d8||On hit, the target’s Attack is -1 for 10 mins. This effect cannot be stacked.||Cute|Incentives|3d8|3|Melee||||3|d8
Twin Beam|Ranged(30ft)|Psychic|Special|3/day|2|d8||Twin Beam is a Scatter attack. It has two attacks.||Cool|Reliable|2d8|3|Ranged|30|||2|d8
Twineedle|Melee|Bug|Attack|3/day|2|d8||Twineedle is a Scatter attack. It has two attacks. On either hit, if you got 14 or higher on Accuracy Check, the target is Poisoned.||Cool|Reliable|2d8|3|Melee||||2|d8
Twinkle Tackle|Melee(25ft burst)|Fairy|(Variable)|1/day|8|d12||Immediately move next to your target, then roll your accuracy check.||||8d12|1|Melee|25|burst||8|d12
Twister|Ranged(15ft)|Dragon|Special|At-Will|1|d12||On hit, if you got 18 or higher on Accuracy Check, the target is Stunned.||Cool|Appeal|1d12|0|Ranged|15|||1|d12
Twisting Gust|Ranged(120ft)|Dragon|Special|At-Will|1|d12||||||1d12|0|Ranged|120|||1|d12
Type Flash|Ranged(25ft)|(Variable)|Special|3/day|3|d10||On hit, your Special Attack is +1 for 10 mins. This effect cannot be stacked.||||3d10|3|Ranged|25|||3|d10
Type Smasher|Melee|(Variable)|Attack|3/day|3|d10||On hit, your Attack is +1 for 10 mins. This effect cannot be stacked.||||3d10|3|Melee||||3|d10
Unbreakable Armor|Self|Normal|Special|3/day||||Your Defense is +4 for 10 mins, your Attack and Special Attack is -10 for 10 mins. This effect cannot be stacked.|||||3|Self|||||
Unbreakable Barrier|Self|Normal|Special|3/day||||Your Special Defense is +4 for 10 mins, your Attack and Special Attack is -10 for 10 mins. This effect cannot be stacked.|||||3|Self|||||
Uproar|Ranged(20ft burst)|Normal|Special|1/day|3|d10||You may move, but then must use Uproar for two more consecutive rounds. Sleeping Pokémon within range of Uproar are awoken and Pokémon cannot go to Sleep within Uproar's range.||Cute|Unsettling|3d10|1|Ranged|20|burst||3|d10
V-Create|Ranged(40ft burst)|Fire|Attack|1/day|8|d20||On hit, all targets are Burned.||||8d20|1|Ranged|40|burst||8|d20
Vacuum Wave|Ranged(15ft)|Fighting|Special|At-Will|2|d6||Vacuum Wave has Priority.||Clever|Quick Set|2d6|0|Ranged|15|||2|d6
Venom Drench|Ranged(10ft)|Poison|Effect|3/day||||Venom Drench can only target a Poisoned or Toxified enemy. On hit, the target’s Attack, Special Attack, and Speed are -3 for 10 mins. This effect cannot be stacked.|Repulsive|Clever|Incentives||3|Ranged|10||||
Venoshock|Ranged(10ft)|Poison|Special|3/day|2|d10||If the target is Poisoned or Toxified, Venoshock has 4d10 for damage instead.||Clever|Incentives|2d10|3|Ranged|10|||2|d10
Vice Grip|Melee|Normal|Attack|At-Will|2|d8||||Tough|Appeal|2d8|0|Melee||||2|d8
Vicious Insult|Ranged(25ft)|Dark|Effect|3/day|||-4|Unless you’ve spent at least 10 mins with the target, Vicious Insult has -4 during accuracy check. On hit, the target is stunned. On hit, during the target’s next 3 turns it must succeed a confidence check by rolling 11 or greater on 1d20+any one of their modifiers or be stunned again.|||||3|Ranged|25||||
Victory Dance|Self|Fighting|Effect|1/day||||Your Attack, Special Attack, Defense, and Special Defense are all +2 for 5 mins.||Beauty|Seen Nothing Yet||1|Self|||||
Vine Whip|Ranged(20ft)|Grass|Attack|At-Will|2|d8|||Threaded|Cool|Appeal|2d8|0|Ranged|20|||2|d8
Vital Throw|Melee|Fighting|Attack|3/day|3|d8||You can’t miss targets with less than 15 Defense if the target already acted this round. On hit, move the target away from you 15ft.||Cool|Slow Set|3d8|3|Melee||||3|d8
Void Fury|Melee|Dark|Attack|1/day|5|d12||On hit, your Defense and Special Defense is -2 for 10 mins. This effect cannot be stacked.||||5d12|1|Melee||||5|d12
Volcanic Devastation|Ranged(100ft burst)|Water/Fire|Special|1/day|10|d12||Volcanic Devastation counts as both a Water and Fire type move for effectiveness. When you use this attack you immediately end your turn. During your next turn, you can't act. On the round after that, when it's your turn roll Volcanic Devastation's Accuracy Check and damage. Set your HP to -300% HP and you must make three death savings throws.||||10d12|1|Ranged|100|burst||10|d12
Volt Tackle|Melee|Electric|Attack|1/day|5|d12||On hit, you lose HP equal to 1/3rd of the damage you deal and if you got 18 or higher on Accuracy Check, the target is Paralyzed.|Zapper|Cool|Seen Nothing Yet|5d12|1|Melee||||5|d12
Wake-Up Slap|Melee|Fighting|Attack|3/day|3|d8||If Wake-Up Slap is used against a Sleeping target, Wake-Up Slap deals 5d8 for damage instead, then cures the target of Sleep. If you choose not to roll damage while using Wake-Up Slap, you do not need to roll an Accuracy Check.||Cute|Inversed Appeal|3d8|3|Melee||||3|d8
Water Gun|Ranged(20ft)|Water|Special|At-Will|2|d6|||Fountain|Cute|Appeal|2d6|0|Ranged|20|||2|d6
Water Pulse|Ranged(20ft burst)|Water|Special|3/day|3|d8||On hit, if you got 16 or higher on Accuracy Check, the target is Confused.|Fountain|Beauty|Round Starter|3d8|3|Ranged|20|burst||3|d8
Water Shuriken|Ranged(15ft)|Water|Special|At-Will|1|d4||Water Shuriken has Priority and is a Scatter attack. Up to 5 attacks.||Tough|Reliable|1d4|0|Ranged|15|||1|d4
Water Sport|Melee|Water|Effect|At-Will||||Put a Water Coat on the target or yourself. The Coat has the following ability: Reduce damage from Fire attacks that hit you by 10. This Coat lasts for 2 mins.||Cute|Hold That Thought||0|Melee|||||
Water Spout|Ranged(30ft burst)|Water|Special|1/day|3|d10||If you are at Max HP, Water Spout has 5d12 for damage instead.||Beauty|Seen Nothing Yet|3d10|1|Ranged|30|burst||3|d10
Waterfall|Melee|Water|Attack|3/day|3|d10||On hit, if you got 16 or higher on Accuracy Check, the target is Stunned.|Fountain|Tough|Appeal|3d10|3|Melee||||3|d10
Wave Crash|Melee|Water|Attack|1/day|3|d12||On hit, you lose HP equal to 1/4th of the damage you deal. Your speed is +2 for 10 mins. This effect cannot be stacked.||||3d12|1|Melee||||3|d12
Weather Ball|Ranged(25ft)|Normal|Special|3/day|3|d8||If within weather, Weather Ball has 5d8 for damage instead and its type changes to match the weather.||Clever|Incentives|3d8|3|Ranged|25|||3|d8
Whirling Kinesis|Ranged(10ft)|Psychic|Effect|At-Will||||On hit, the target’s Accuracy Checks are -3 during their next turn. This effect cannot be stacked.|||||0|Ranged|10||||
Whirlpool|Ranged(10ft)|Water|Special|3/day|1|d4||On hit, the target is bound in place for 1d4 rounds. For each round the target is bound, it takes 1d4 damage on its turns.|Fountain|Beauty|Torrential Appeal|1d4|3|Ranged|10|||1|d4
Whirlwind|Ranged(20ft)|Normal|Effect|3/day||||On hit, moves the target 60ft away.||Clever|Big Show||3|Ranged|20||||
Wicked Blow|Melee|Dark|Attack|3/day|3|d12||On hit, Wicked Blow always counts as a critical hit.||||3d12|3|Melee||||3|d12
Wild Charge|Melee|Electric|Attack|3/day|3|d10||On hit, you lose HP equal to 1/4th of the damage you deal.|Zapper|Tough|Appeal|3d10|3|Melee||||3|d10
Will-O-Wisp|Ranged(10ft)|Fire|Effect|1/day||||On hit, the target is Burned.||Beauty|Round Starter||1|Ranged|10||||
Wing Attack|Melee|Flying|Attack|At-Will|2|d8||||Cool|Appeal|2d8|0|Melee||||2|d8
Wish|Melee|Normal|Effect|1/day||||Target an ally or yourself. After the target acts during the next round, they are healed HP equal to half of the target’s Max HP.||Cute|Reflective Appeal||1|Melee|||||
Wonder Room|Field|Psychic|Effect|3/day||||You create a circle of Wonderful Terrain with a 60ft diameter. Anyone who attacks within the Wonderful terrain makes Attack Accuracy Checks against Special Defense and Special Attack Accuracy Checks against Defense. This terrain disappears after 2 mins.||Cute|Scrambler||3|Field|||||
Wood Hammer|Melee|Grass|Attack|1/day|5|d12||On hit, you lose HP equal to 1/3rd of the damage you deal.||Tough|Round Ender|5d12|1|Melee||||5|d12
Wrap|Melee|Normal|Attack|At-Will|1|d4||On hit, the target is bound to you for 1d4 rounds. For each round the target is bound, it takes 1d4 damage on its turns.||Tough|Torrential Appeal|1d4|0|Melee||||1|d4
X-Scissor|Melee|Bug|Attack|3/day|3|d10||||Beauty|Round Starter|3d10|3|Melee||||3|d10
Yawn|Melee|Normal|Effect|3/day||||On hit, the target falls Asleep after its next turn.||Cute|Excitement||3|Melee|||||
Zap Cannon|Ranged(30ft)|Electric|Special|1/day|5|d12|-5|Zap Cannon has -5 during Accuracy Check. On hit the target is Paralyzed.|Zapper|Cool|Incentives|5d12|1|Ranged|30|||5|d12
Zen Headbutt|Melee|Psychic|Attack|3/day|3|d10||On hit, if you got 18 or higher on Accuracy Check, the target is Stunned.||Beauty|Round Ender|3d10|3|Melee||||3|d10
Zing Zap|Melee|Electric|Attack|3/day|3|d10||On hit, if you got 18 or higher on Accuracy Check, the target is Stunned.||Tough|Appeal|3d10|3|Melee||||3|d10`;
    const rows = CSV.split(/\n/);
    const headerRow = rows.shift();

    // group all pieces into their proper data sets
    const sets = [];
    for (const row of rows) {
        const pieces = row.split("|");

        let uses = pieces[4];
        if (uses == "3/day") uses = 3;
        else if (uses == "1/day" || uses == "1/GMAX") uses = 1;
        else uses = 0;

        sets.push({
            name: pieces[0],
            type: 'move',
            system: {
                range: {
                    value: Number(pieces[15]),
                    type: Number(pieces[15]) > 5 ? "ranged" : "melee"
                },
                type: pieces[2],
                category: pieces[3],
                //frequency: pieces[i + 4],
                damage: {
                    formula: `${pieces[5]}${pieces[6]}`
                },
                accuracy: pieces[7],
                description: pieces[8],
                uses: {
                    value: uses,
                    max: uses
                }
            }
        });
    }

    // filter and adjust the data to match the schema
    for (const move of sets) {
        if (typeof move.system.type == 'string') move.system.type = move.system.type.toLowerCase();
        if (!Object.keys(typings).includes(move.system.type)) move.system.type = "normal";
        if (!move.system.type) move.system.type = "normal";
        if (move.name == "") move.name = "New Move";

        if (typeof move.system.range.value != 'number') move.system.range.value = move.system.range.type == "melee" ? 5 : 30;
    }

    console.log(sets);

    // gather the moves from the pokeapi reference, everything should be checked against
    console.log(PTA.Pokedex.Moves);
    for (const move of sets) {
        try {
            if (!PTA.Pokedex.Moves.includes(utils.sluggify(move.name))) {
                console.log("Invalid name, skipping api call...", utils.sluggify(move.name));
                continue;
            }
            const apiData = await pokeapi.move(utils.sluggify(move.name));
            if (!apiData) {
                console.log("Failed to retrieve api, skipping...", utils.sluggify(move.name));
                continue;
            }

            // prepare initial api data pass, needs to be parsed further along
            move.system.api = {
                id: apiData.id,
                name: apiData.name,
                accuracy: apiData.accuracy,
                effect_chance: apiData.effect_chance,
                pp: apiData.pp,
                priority: apiData.priority,
                power: apiData.power,
                contest_combos: {
                    normal: {
                        use_before: apiData.contest_combos?.normal?.use_before?.map(e => e.name),
                        use_after: apiData.contest_combos?.normal?.use_after?.map(e => e.name)
                    },
                    super: {
                        use_before: apiData.contest_combos?.super?.use_before?.map(e => e.name),
                        use_after: apiData.contest_combos?.super?.use_after?.map(e => e.name)
                    }
                },
                contest_type: apiData?.contest_type?.name,
                contest_effect: {
                    appeal: 0,
                    id: 0,
                    jam: 0,
                },
                damage_class: apiData.damage_class?.name,
                effect_chance: apiData.effect_chance,
                effect_entries: apiData?.effect_entries.map(e => { return { effect: e.effect, short_effect: e.short_effect, language: e.language.name } }),
                flavour_text_entries: apiData?.flavor_text_entries?.map(e => { return { flavour_text: e.flavor_text, language: e.language.name, version_group: e.version_group.name } }),
                generation: apiData.generation?.name,
                meta: {
                    ailment: apiData.meta?.ailment?.name,
                    ailment_chance: apiData?.meta?.ailment_chance,
                    category: apiData.meta?.category.name,
                    crit_rate: apiData.meta?.crit_rate,
                    drain: apiData.meta?.drain,
                    flinch_chance: apiData.meta?.flinch_chance,
                    healing: apiData.meta?.healing,
                    max_hits: apiData.meta?.max_hits,
                    max_turns: apiData.meta?.max_turns,
                    min_hits: apiData.meta?.min_hits,
                    min_turns: apiData.meta?.min_turns,
                    stat_chance: apiData.meta?.stat_chance
                },
                names: apiData?.names?.map(e => { return { name: e.name, language: e.language.name } }),
                stat_changes: apiData?.stat_changes?.map(e => { return { change: e.change, stat: e.stat.name } }),
                super_contest_effect: {
                    appeal: 0,
                    id: 0
                },
                target: apiData.target.name,
                type: apiData.type.name,
            }

            // use the api data to populate the moves regular data fields
            move.system.drain = move.system.api.meta.drain;
            move.system.priority = move.system.api.priority;
            if (move.system.api.meta.ailment) move.system.ailment = {
                type: move.system.api.meta.ailment,
                chance: move.system.api.meta.ailment_chance
            }
            move.system.multi_hit = {
                max: move.system.api.meta.max_hits,
                min: move.system.api.meta.min_hits,
            }

            console.log("Api enriched move data", move);
        } catch (err) {
            console.error(err);
        }
    }

    ui.notifications.notify("Creating documents, please wait");
    await Item.createDocuments(sets);
    ui.notifications.clear();
    ui.notifications.notify("Finished creating documents!");
}