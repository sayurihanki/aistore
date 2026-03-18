/* global cy, describe, it */

describe('Verify immersive PDP variant', () => {
  it('activates the immersive stack for compatible configurable products', () => {
    cy.visit('/immersive-pdp-demo.html');

    cy.get('.product-configurator-luxe__shell', { timeout: 20000 }).should('be.visible');
    cy.get('.product-details')
      .should('have.class', 'product-details--configurator-active')
      .and('have.class', 'product-details--immersive-active');
    cy.get('.product-details__configuration').should('not.be.visible');
    cy.get('.product-details__description').should('not.be.visible');
    cy.get('.product-details__attributes').should('not.be.visible');

    cy.get('.product-technical-details__shell', { timeout: 20000 }).should('be.visible');
    cy.get('.product-technical-details__spec-card').should('have.length.at.least', 3);
    cy.get('.product-technical-details__accordion-button[aria-expanded="true"]').should('have.length', 1);
    cy.get('.product-configurator-luxe__primary-cta').should('exist');
    cy.get('.product-configurator-luxe__mobile-cta').should('exist');
  });

  it('falls back to the normal PDP for incompatible products', () => {
    cy.visit('/immersive-pdp-fallback-demo.html');

    cy.get('.product-details').should('not.have.class', 'product-details--configurator-active');
    cy.get('.product-details__configuration', { timeout: 20000 }).should('be.visible');
    cy.get('.product-configurator-luxe__shell').should('not.exist');
    cy.get('.product-technical-details__shell').should('not.exist');
  });
});
