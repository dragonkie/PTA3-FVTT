import ItemData from "../item.mjs";

const {
    AlphaField,
    AngleField,
    AnyField,
    ArrayField,
    BooleanField,
    ColorField,
    DataField,
    FilePathField,
    ForeignDocumentField,
    HTMLField,
    HueField,
    IntegerSortField,
    JSONField,
    JavaScriptField,
    NumberField,
    ObjectField,
    SchemaField,
    SetField,
    ShaderField,
    ShapesField,
    StringField,
    TypeDataField,
    TypedObjectField,
    TypedSchemaField
} = foundry.data.fields;

export default class CareerData extends ItemData {
    static defineSchema() {
        const schema = super.defineSchema();

        schema.isAdvanced = new BooleanField({ initial: false });

        // All classes on a character are assigned an invisible order slot based on the order they're added to a character
        // this is to keep the order of the 4 class combos in check through updates, rather than trusting the player
        // character to maintain them properly
        schema.slot = new NumberField({ initial: 1 });

        schema.features = new TypedObjectField(new SchemaField({
            name: new StringField(),
            img: new FilePathField({ initial: "icons/svg/heal.svg", categories: ['IMAGE'] }),
            level: new NumberField(),
            description: new HTMLField(),
            choices: new NumberField(),// Value of choices, stat points, skill profs, number of limited items to take...
            type: new StringField({
                initial: 'item',
                choices: {
                    item: 'PTA.choice.item',
                    skill: 'PTA.choice.skill',
                    stat: 'PTA.choice.stat',
                    multiclass: 'PTA.choice.multiclass'
                }
            }),// different feature methods, different selections
            items: new TypedObjectField(new StringField({ initial: "" }), { initial: {} }),
        }), { initial: {} })

        return schema;
    }

    prepareBaseData() {
        super.prepareBaseData();

        this.level = 1;
    }

    prepareDerivedData() {
        super.prepareDerivedData();

        if (this.actor && this.actor.type == 'character') {
            console.log('actor level', this.actor.system);
            console.log('class level', this.actor.system.level - Math.max(0, 4 * (this.slot - 1) - 2))
            this.level = this.actor.system.level - Math.max(0, 4 * (this.slot - 1) - 2);
        }
    }
}