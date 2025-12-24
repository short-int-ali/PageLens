/**
 * PageSnapshot - The only data structure classifiers can use
 * Contains all observable evidence from a crawled page
 */

/**
 * @typedef {Object} InputElement
 * @property {string} type - Input type (text, email, password, etc.)
 * @property {string} name - Input name attribute
 * @property {string} placeholder - Placeholder text
 */

/**
 * @typedef {Object} ButtonElement
 * @property {string} text - Button visible text
 * @property {string} type - Button type (submit, button, etc.)
 */

/**
 * @typedef {Object} LinkElement
 * @property {string} href - Link href
 * @property {string} text - Link visible text
 */

/**
 * @typedef {Object} PageSnapshot
 * @property {string} url - Page URL
 * @property {string} title - Page title
 * @property {string} visibleText - All visible text on the page
 * @property {InputElement[]} inputs - Form inputs found
 * @property {ButtonElement[]} buttons - Buttons found
 * @property {LinkElement[]} links - Links found
 */

/**
 * Creates a PageSnapshot object
 * @param {Object} data - Raw page data
 * @returns {PageSnapshot}
 */
export function createPageSnapshot(data) {
  return {
    url: data.url || '',
    title: data.title || '',
    visibleText: data.visibleText || '',
    inputs: (data.inputs || []).map(input => ({
      type: input.type || 'text',
      name: input.name || '',
      placeholder: input.placeholder || ''
    })),
    buttons: (data.buttons || []).map(button => ({
      text: button.text || '',
      type: button.type || 'button'
    })),
    links: (data.links || []).map(link => ({
      href: link.href || '',
      text: link.text || ''
    }))
  };
}

