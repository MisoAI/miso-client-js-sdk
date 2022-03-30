import { Component } from '@miso.ai/commons';
import Api from '../api';
import ApiBase from '../api/base';
import ApiHelpers from '../api/helpers';
import Interactions from '../api/interactions';
import Recommendation from '../api/recommendation';
import Search from '../api/search';
import Context from '../context';
import { DebugPlugin } from './debug';
import { DryRunPlugin } from './dry-run';

export default {
  Component,
  api: { Api, ApiBase, ApiHelpers, Interactions, Recommendation, Search },
  context: { Context },
  plugin: { DebugPlugin, DryRunPlugin },
}
