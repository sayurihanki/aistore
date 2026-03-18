/* global cy, describe, expect, it */

describe('Verify product configurator luxe', () => {
  it('Initializes on the demo PDP and updates the configured total', () => {
    cy.visit('/product-configurator-luxe-demo.html');

    cy.get('.product-configurator-luxe__shell', { timeout: 20000 }).should('be.visible');
    cy.get('.product-details').should('have.class', 'product-details--configurator-active');
    cy.get('.product-details__configuration').should('not.be.visible');

    cy.contains('.product-configurator-luxe__choice-title', '24U').click();
    cy.contains('.product-configurator-luxe__choice-title', 'Glass + key lock').click();
    cy.contains('.product-configurator-luxe__choice-title', 'Server room').click();

    cy.contains('.product-configurator-luxe__step-pill', 'Operations').click();
    cy.contains('.product-configurator-luxe__choice-title', 'Dense').click();

    cy.contains('.product-configurator-luxe__step-pill', 'Review').click();
    cy.get('.product-configurator-luxe__addon-card').should('have.length.at.least', 1);

    cy.get('.product-configurator-luxe__grand-total-value').invoke('text').then((beforeTotal) => {
      cy.contains('.product-configurator-luxe__addon-toggle', 'Add accessory').first().click();
      cy.get('.product-configurator-luxe__grand-total-value').should(($after) => {
        expect($after.text().trim()).not.to.eq(beforeTotal.trim());
      });
    });

    cy.get('.product-configurator-luxe__primary-cta').should('not.be.disabled');
  });
});
