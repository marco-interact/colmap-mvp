@extends('layouts.auth')

@section('content')
<form class="auth-form" method="POST" action="{{ route('register') }}">
    @csrf

    <div class="form-group">
        <label for="name">Nombre Completo <span class="required">Mandatory</span></label>
        <input 
            id="name" 
            type="text" 
            name="name" 
            value="{{ old('name') }}" 
            placeholder="Nombre completo"
            required 
            autocomplete="name" 
            autofocus
        >
        @error('name')
            <div class="field-help" style="color: #ef4444;">{{ $message }}</div>
        @enderror
    </div>

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
            autocomplete="new-password"
        >
        @error('password')
            <div class="field-help" style="color: #ef4444;">{{ $message }}</div>
        @enderror
    </div>

    <div class="form-group">
        <label for="password_confirmation">Confirmar Contraseña <span class="required">Mandatory</span></label>
        <input 
            id="password_confirmation" 
            type="password" 
            name="password_confirmation" 
            placeholder="Confirmar contraseña"
            required 
            autocomplete="new-password"
        >
    </div>

    <button type="submit" class="btn-primary">
        CREAR CUENTA
    </button>
</form>

<div class="auth-footer">
    <p>¿Ya tienes una cuenta? <a href="{{ route('login') }}">Inicia sesión</a></p>
</div>
@endsection