import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import keys from 'core/utils/key-codes';
import { keyIsFolder, parentKeyForKey, keyWithoutParentKey } from 'core/utils/key-utils';
import escapeStringRegexp from 'escape-string-regexp';
import { tracked } from '@glimmer/tracking';

export default class KvListFilterComponent extends Component {
    @service router;
    @tracked filterIsFocused = false;

    navigate(pathToSecret, pageFilter) {
        const route = pathToSecret ? `${this.args.mountPoint}.list-directory` : `${this.args.mountPoint}.list`;
        const args = [route];
        if (pathToSecret) {
            args.push(pathToSecret);
        }
        args.push({
            queryParams: {
                pageFilter: pageFilter ? pageFilter : null,
            },
        });
        this.router.transitionTo(...args);
    }

    get partialMatch() {
        const value = !this.args.pageFilter ? '' : this.args.pageFilter;
        const reg = new RegExp('^' + escapeStringRegexp(value));
        const match = this.args.secrets.filter((path) => reg.test(path.fullSecretPath))[0];
        if (this.isFilterMatch || !match) return null;
        return match.fullSecretPath;
    }

    get isFilterMatch() {
        return !!this.args.secrets?.findBy('fullSecretPath', this.args.filterValue);
    }

    @action
    handleInput(event) {
        const input = event.target.value;
        const isDirectory = keyIsFolder(input);
        const parentDirectory = parentKeyForKey(input);
        const secretWithinDirectory = keyWithoutParentKey(input);

        if (isDirectory) {
            this.navigate(input);
        } else if (parentDirectory) {
            this.navigate(parentDirectory, secretWithinDirectory);
        } else {
            this.navigate(null, input);
        }
    }

    @action
    handleKeyDown(event) {
        const input = event.target.value;
        const parentDirectory = parentKeyForKey(input);

        if (event.keyCode === keys.BACKSPACE) {
            this.handleBackspace(input, parentDirectory);
        }
        if (event.keyCode === keys.TAB) {
            event.preventDefault();
            this.handleTab();
        }
        if (event.keyCode === keys.ENTER) {
            event.preventDefault();
            this.handleEnter(input);
        }
        if (event.keyCode === keys.ESC) {
            this.handleEscape(parentDirectory);
        }
    }

    handleBackspace(input, parentDirectory) {
        const isInputDirectory = keyIsFolder(input);
        const inputWithoutParentKey = keyWithoutParentKey(input);
        const pageFilter = isInputDirectory ? '' : inputWithoutParentKey.slice(0, -1);
        this.navigate(parentDirectory, pageFilter);
    }

    handleTab() {
        const isMatchDirectory = keyIsFolder(this.partialMatch);
        const matchParentDirectory = parentKeyForKey(this.partialMatch);
        const matchWithinDirectory = keyWithoutParentKey(this.partialMatch);

        if (isMatchDirectory) {
            this.navigate(this.partialMatch);
        } else if (!isMatchDirectory && matchParentDirectory) {
            this.navigate(matchParentDirectory, matchWithinDirectory);
        } else {
            this.navigate(null, this.partialMatch);
        }
    }

    handleEnter(input) {
        if (this.isFilterMatch) {
            this.router.transitionTo(`${this.args.mountPoint}.secret.details`, input);
        } else {
            this.router.transitionTo(`${this.args.mountPoint}.create`, {
                queryParams: { initialKey: input },
            });
        }
    }

    handleEscape(parentDirectory) {
        !parentDirectory ? this.navigate() : this.navigate(parentDirectory);
    }

    @action
    setFilterIsFocused() {
        this.filterIsFocused = true;
    }

    @action
    focusInput() {
        if (this.args.filterValue) {
            document.getElementById('secret-filter')?.focus();
        }
    }
}
