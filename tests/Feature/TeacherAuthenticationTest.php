<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TeacherAuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_teacher_can_sign_in_after_registering_and_signing_out_with_the_same_email_casing(): void
    {
        $email = 'New.Teacher@Example.com';
        $password = 'A-secure-password-123';

        $this->post(route('register.store'), [
            'name' => 'New Teacher',
            'email' => $email,
            'password' => $password,
            'password_confirmation' => $password,
        ])->assertRedirect(route('teacher.dashboard'));

        $this->assertAuthenticated();

        $this->post(route('logout'))->assertRedirect(route('login'));
        $this->assertGuest();

        $this->post(route('login.store'), [
            'email' => $email,
            'password' => $password,
        ])->assertRedirect(route('teacher.dashboard'));

        $this->assertAuthenticated();
    }
}
