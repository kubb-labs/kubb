export type petQuestionTokenAndUndefined = {
  /**
   * @type integer, int64
   */
  id: number
  /**
   * @type string
   */
  name: string
  /**
   * @type string | undefined
   */
  tag?: string | undefined
  category?: petQuestionTokenAndUndefined | undefined
}
