/// <reference types="cypress" />

describe('File Change', function () {
  before(() => {
    cy.visit('/');
  });
  it('Select Login', function () {
    /** Login */
    cy.get('[data-test=submit-button]').should('have.text', 'Login');
    cy.get('[data-test=username-input] input').type(Cypress.env('TEST_USERNAME'));
    cy.get('[data-test=password-input] input').type(Cypress.env('TEST_PASSWORD'));
    cy.get('[data-test=submit-button]').click();
  });
  it('Select Organization', function () {
    /** Select organization */
    cy.wait(1000);
    cy.contains('unfoldingWord').click();
  });
  it('Select Resource', function () {
    /** Select resource */
    cy.wait(1000);
    cy.contains('Translation Notes').click();
  });
  it('Select Language', function () {
    /** Select language */
    cy.get('.language-select-dropdown').click();
    cy.focused().type('english{enter}');
  });
  it('Select File', function () {
    /** Select file */
    cy.contains('en_tn_57-TIT.tsv').should('be.be.visible').click();
  });
  it('File Change', function () {
    /**logout process */
    cy.get('[data-test=drawer-menu-button]').click();
    cy.contains('en_tn_18-JOB.tsv').click();
    cy.contains('Introduction to Job', { timeout: 20000 });
    //   cy.contains('# Introduction to Titus');
    //   cy.get('[data-test=logout-button]').click();
  });
  // it('preview markdown', function () {
  //     /**logout process */
  //     cy.get('[data-test=preview-icon]').click();
  //     cy.contains('Introduction to Titus')
  //   //   cy.get('[data-test=logout-button]').click();
  //   });
});