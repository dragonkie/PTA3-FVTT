export default class PtaChatMessage extends foundry.documents.ChatMessage.implementation {
    /**
   * Create a new Document using provided input data, saving it to the database.
   * @param {object|Document|(object|Document)[]} [data={}] Initial data used to create this Document, or a Document
   *                                                        instance to persist.
   * @param {Partial<Omit<DatabaseCreateOperation, "data">>} [operation={}]  Parameters of the creation operation
   * @returns {Promise<Document | Document[] | undefined>}        The created Document instance(s)
   *
   * @example Create a new chat message
   * ```js
   * const data = [{content: "Hello world!"}];
   * const message = await ChatMessage.implementation.create(data);
   * ```
   */
    static async create(data = {}, operation = {}) {
        return super.create(data, operation);
    }
}