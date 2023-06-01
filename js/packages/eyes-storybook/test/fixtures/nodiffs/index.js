import React from 'react';
import { storiesOf } from '@storybook/react';
const randomNumber = Math.floor(Math.random() * 100);

storiesOf('Single category', module).add('Single story', () => {
  return <div>random content {randomNumber}</div>
})