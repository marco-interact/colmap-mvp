@extends('layouts.auth')

@section('content')
<form class="auth-form" method="POST" action="{{ route('login') }}">
    @csrf

    <div class="form-group">
        <label for="email">Email <span class="required">Mandatory</span></label>
        <input 
            id="email" 
            type="email" 
            name="email" 
            value="{{ old('email') }}" 
            placeholder="hola@correo.com"
            required 
            autocomplete="email" 
            autofocus
        >
        @error('email')
            <div class="field-help" style="color: #ef4444;">{{ $message }}</div>
        @enderror
    </div>

    <div class="form-group">
        <label for="password">Contraseña <span class="required">Mandatory</span></label>
        <input 
            id="password" 
            type="password" 
            name="password" 
            placeholder="Contraseña"
            required 
            autocomplete="current-password"
        >
        @error('password')
            <div class="field-help" style="color: #ef4444;">{{ $message }}</div>
        @enderror
        <div class="field-help">
            <a href="{{ route('password.request') }}">¿Olvidaste tu contraseña?</a>
        </div>
    </div>

    <button type="submit" class="btn-primary">
        CONTINUAR
    </button>
</form>

<div class="auth-footer">
    <p>¿No tienes una cuenta? <a href="{{ route('register') }}">Regístrate aquí</a></p>
</div>
@endsection