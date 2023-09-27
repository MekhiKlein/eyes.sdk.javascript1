'use strict';
const {describe, it} = require('mocha');
const {expect} = require('chai');
const {splitConfigsByBrowser, shouldRenderIE} = require('../../src/shouldRenderIE');

describe('shouldRenderIE', () => {
  describe('splitConfigsByBrowser', () => {
    it('should work with standard config', () => {
      const config = {
        hello: true,
        environments: [{name: 'chrome'}, {name: 'firefox'}, {name: 'ie'}],
      };
      expect(splitConfigsByBrowser(config)).to.deep.eql([
        {
          hello: true,
          environments: [{name: 'chrome'}, {name: 'firefox'}],
        },
        {
          hello: true,
          environments: [{name: 'ie'}],
        },
      ]);
    });

    it('should work without ie', () => {
      const config = {
        environments: [{name: 'chrome'}, {name: 'firefox'}, {name: 'safari'}],
      };
      expect(splitConfigsByBrowser(config)).to.eql([
        {
          environments: [{name: 'chrome'}, {name: 'firefox'}, {name: 'safari'}],
        },
      ]);
    });

    it('should work only with ie', () => {
      const config = {
        environments: [{name: 'ie'}, {name: 'ie'}],
      };
      expect(splitConfigsByBrowser(config)).to.eql([
        {
          environments: [{name: 'ie'}, {name: 'ie'}],
        },
      ]);
    });

    it('should work with object', () => {
      const config = {
        environments: {name: 'chrome'},
      };

      expect(splitConfigsByBrowser(config)).to.eql([{environments: [{name: 'chrome'}]}]);
    });
  });

  describe('shouldRenderIE', () => {
    it('should return true if IE browsers exist and flag is on', () => {
      const browser = [{name: 'ie'}, {name: 'ie'}];
      const results = shouldRenderIE({environments: browser, fakeIE: true});
      expect(results).to.be.true;
    });

    it('should return false if flag is off', () => {
      const browser = [{name: 'ie'}, {name: 'ie'}];
      const results = shouldRenderIE({browser, fakeIE: false});
      expect(results).to.be.false;
    });

    it('should return false if no IE is in config even if flag is on', () => {
      const browser = [{name: 'chrome'}];
      const results = shouldRenderIE({browser, fakeIE: true});
      expect(results).to.be.false;
    });
  });
});
