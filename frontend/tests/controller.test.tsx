// First: Testing Library needs the DOM when it loads
import './dom';
import './env/controller';
import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import Controller from '../src/controllers/Controller';
import createView from '../src/creators/createView';
import { MISSING_PROVIDER } from '../src/const';
import TestApp from './provider';
import type { ReactNode } from 'react';

/** Renders inside the provider, like the root layout does */
function renderApp(oNode: ReactNode): void {
  render(<TestApp>{oNode}</TestApp>);
}

/** Renders of the counter, to check which writes render it */
let iRenders = 0;

/** Counter on the `app` store */
class CounterController extends Controller {
  /** Adds one */
  public increment(): void {
    // Adds one
    const { app } = this.stores;
    app.set('/iCount', app.get('/iCount') + 1);
  }

  /** Adds a value and keeps who added it */
  public update(iValue: number): void {
    // Adds the value and keeps the name of the props
    const { app } = this.stores;
    app.set('/iCount', app.get('/iCount') + iValue);
    app.set('/sReason', `${this.props.sName} ${iValue}`);
  }
}

const Counter = createView(CounterController, (counter, props) => {
  iRenders++;
  return (
    <div>
      <output>{counter.stores.app.get('/iCount')}</output>
      <span>{`${props.sName}: ${counter.stores.app.get('/sReason')}`}</span>
      <button onClick={counter.increment}>+</button>
      <button onClick={() => counter.update(-5)}>-5</button>
    </div>
  );
});

afterEach(cleanup);

describe('createView', () => {
  test('a method gets its arguments, the stores and the props; the view shows the result', () => {
    // Clicks the method passed alone, then the one with an argument
    renderApp(<Counter sName="Ana" />);
    fireEvent.click(screen.getByText('+'));
    fireEvent.click(screen.getByText('-5'));

    assert.equal(screen.getByRole('status').textContent, '-4');
    assert.ok(screen.getByText('Ana: Ana -5'));
  });

  test('two views of one controller share the stores', () => {
    // Creates a second view that only increments
    const Increment = createView(CounterController, counter => (
      <button onClick={counter.increment}>inc</button>
    ));
    renderApp(
      <>
        <Counter sName="Ivo" />
        <Increment />
      </>,
    );

    // Clicks the second view: the first one shows the write
    fireEvent.click(screen.getByText('inc'));

    assert.equal(screen.getByRole('status').textContent, '1');
  });

  test('several writes in one method render once, and other paths render nothing', () => {
    // Renders the counter next to a view that writes a path the counter does not read
    class ToggleController extends Controller {
      public toggle(): void {
        // Opens or closes
        const { ui } = this.stores;
        ui.set('/isOpen', !ui.get('/isOpen'));
      }
    }
    const Toggle = createView(ToggleController, toggle => (
      <button onClick={toggle.toggle}>toggle</button>
    ));
    renderApp(
      <>
        <Counter sName="Eva" />
        <Toggle />
      </>,
    );
    iRenders = 0;

    // Writes the other path, then two paths of the counter in one method
    fireEvent.click(screen.getByText('toggle'));
    fireEvent.click(screen.getByText('-5'));

    assert.equal(iRenders, 1);
  });

  test('a method reads the props of the last render on screen', () => {
    // A view whose method reads the name of the props
    class NameController extends Controller {
      public name(): void {
        // Keeps the name of the props
        this.stores.app.set('/sReason', this.props.sName);
      }
    }
    const Name = createView(NameController, names => <button onClick={names.name}>name</button>);
    const { rerender } = render(
      <TestApp>
        <Name sName="old" />
        <Counter sName="x" />
      </TestApp>,
    );

    // Renders new props, then calls the method
    rerender(
      <TestApp>
        <Name sName="new" />
        <Counter sName="x" />
      </TestApp>,
    );
    fireEvent.click(screen.getByText('name'));

    assert.ok(screen.getByText('x: new'));
  });

  test('a method keeps one function for the whole mount', () => {
    // A view that keeps each function it passes
    const aMethods: unknown[] = [];
    const Kept = createView(CounterController, (counter, props) => {
      aMethods.push(counter.increment);
      return <span>{props.sName}</span>;
    });
    const { rerender } = render(
      <TestApp>
        <Kept sName="a" />
      </TestApp>,
    );

    // Renders again with other props
    rerender(
      <TestApp>
        <Kept sName="b" />
      </TestApp>,
    );

    assert.equal(aMethods.length, 2);
    assert.equal(aMethods[0], aMethods[1]);
  });

  test('a subclass replaces a method and reaches the original with super', () => {
    // A counter whose increment adds ten through the original update
    class TenController extends CounterController {
      public increment(): void {
        // Adds ten with the original update
        super.update(10);
      }
    }
    const Ten = createView(TenController, ten => <button onClick={ten.increment}>ten</button>);
    renderApp(
      <>
        <Ten sName="Leo" />
        <Counter sName="Leo" />
      </>,
    );

    // Clicks the replaced method, then the original controller's
    fireEvent.click(screen.getByText('ten'));
    fireEvent.click(screen.getByText('+'));

    assert.equal(screen.getByRole('status').textContent, '11');
  });

  test('a method reaches the others with this, also when the view passes it alone', () => {
    // A controller whose last item comes from its items, and a subclass with other items
    class ItemsController extends Controller {
      public items(): string[] {
        return ['a', 'b'];
      }

      public last(): string {
        return this.items()[1];
      }
    }
    class OtherItemsController extends ItemsController {
      public items(): string[] {
        return ['c', 'd'];
      }
    }
    const fnView = ({ last }: ItemsController): ReactNode => <span>{last()}</span>;
    const Items = createView(ItemsController, fnView);
    const Others = createView(OtherItemsController, fnView);

    // Renders both: each view calls last alone
    renderApp(
      <>
        <Items />
        <Others />
      </>,
    );

    assert.ok(screen.getByText('b'));
    assert.ok(screen.getByText('d'));
  });

  test('onMount runs once when the view mounts, and a subclass runs both with super', () => {
    // A controller that logs its mount, and a subclass with another log
    class MountController extends Controller {
      public onMount(): void {
        // Logs the name of the props
        const { app } = this.stores;
        app.set('/sLog', `${app.get('/sLog') ?? ''}${this.props.sName}`);
      }
    }
    class MarkController extends MountController {
      public onMount(): void {
        // Logs the original, then a mark
        super.onMount();
        const { app } = this.stores;
        app.set('/sLog', `${app.get('/sLog')}+`);
      }
    }
    const Mounted = createView(MountController, mount => (
      <output>{mount.stores.app.get('/sLog')}</output>
    ));
    const Marked = createView(MarkController, () => null);

    // Mounts the view, then the subclass's
    renderApp(
      <>
        <Mounted sName="a" />
        <Marked sName="b" />
      </>,
    );

    assert.equal(screen.getByRole('status').textContent, 'ab+');
  });

  test('onUnmount runs when the view unmounts', () => {
    // A controller that logs its unmount outside the stores
    const aLog: string[] = [];
    class UnmountController extends Controller {
      public onUnmount(): void {
        // Logs its mark
        aLog.push('a');
      }
    }
    const Unmounted = createView(UnmountController, () => null);

    // Mounts and unmounts the view
    const { unmount } = render(
      <TestApp>
        <Unmounted />
      </TestApp>,
    );
    assert.deepEqual(aLog, []);
    unmount();

    assert.deepEqual(aLog, ['a']);
  });

  test('a view without logic takes the base Controller and reads the stores', () => {
    // A view that only shows a store path
    const Count = createView(Controller, view => <output>{view.stores.app.get('/iCount')}</output>);
    renderApp(
      <>
        <Count />
        <Counter sName="Mia" />
      </>,
    );

    // Writes the path from the counter: the view shows it
    fireEvent.click(screen.getByText('+'));

    assert.equal(screen.getAllByRole('status')[0].textContent, '1');
  });

  test('text reads a key in the texts of /locale, English by default, and gives the key without one', () => {
    // A view with a text of the app, one no locale has and a switch to Spanish
    const Title = createView(Controller, view => (
      <>
        <output>
          {view.text('home.title')} {view.text('home.missing')}
        </output>
        <button onClick={() => view.stores.app.set('/locale', 'es')}>es</button>
      </>
    ));
    renderApp(<Title />);
    assert.equal(screen.getByRole('status').textContent, 'Home home.missing');

    // Another locale renders it again
    fireEvent.click(screen.getByText('es'));
    assert.equal(screen.getByRole('status').textContent, 'Inicio home.missing');
  });

  test('a view without NanoAppProvider fails with the fix', () => {
    // Renders outside the provider
    assert.throws(() => render(<Counter />), { message: MISSING_PROVIDER });
  });
});
