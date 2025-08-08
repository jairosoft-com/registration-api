"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterPage = void 0;
class RegisterPage {
    page;
    constructor(page) {
        this.page = page;
    }
    async goto() {
        await this.page.goto('/register');
    }
    async fillName(name) {
        await this.page.getByPlaceholder('Name').fill(name);
    }
    async fillEmail(email) {
        await this.page.getByPlaceholder('Email').fill(email);
    }
    async fillPassword(password) {
        await this.page.getByPlaceholder('Password').fill(password);
    }
    async submit() {
        await this.page.getByRole('button', { name: 'Register' }).click();
    }
    async getSuccessMessage() {
        return this.page.locator('#success-message').textContent();
    }
}
exports.RegisterPage = RegisterPage;
//# sourceMappingURL=register.page.js.map