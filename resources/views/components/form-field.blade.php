{{-- Form Field Component --}}
@props(['name', 'label', 'type' => 'text', 'required' => false, 'value' => '', 'placeholder' => '', 'help' => ''])

@php
$fieldId = $name . '-' . uniqid();
$hasError = $errors->has($name);
@endphp

<div class="form-group @if($hasError) has-error @endif">
    @if($label)
        <label for="{{ $fieldId }}" class="form-label">
            {{ $label }}
            @if($required)
                <span class="required">*</span>
            @endif
        </label>
    @endif

    @if($type === 'textarea')
        <textarea 
            id="{{ $fieldId }}" 
            name="{{ $name }}" 
            class="form-control"
            placeholder="{{ $placeholder }}"
            @if($required) required @endif
            {{ $attributes }}
        >{{ old($name, $value) }}</textarea>
    @elseif($type === 'select')
        <select 
            id="{{ $fieldId }}" 
            name="{{ $name }}" 
            class="form-control"
            @if($required) required @endif
            {{ $attributes }}
        >
            {{ $slot }}
        </select>
    @elseif($type === 'file')
        <input 
            type="file" 
            id="{{ $fieldId }}" 
            name="{{ $name }}" 
            class="form-control"
            @if($required) required @endif
            {{ $attributes }}
        >
    @else
        <input 
            type="{{ $type }}" 
            id="{{ $fieldId }}" 
            name="{{ $name }}" 
            class="form-control"
            value="{{ old($name, $value) }}"
            placeholder="{{ $placeholder }}"
            @if($required) required @endif
            {{ $attributes }}
        >
    @endif

    @if($help)
        <div class="field-help">{{ $help }}</div>
    @endif

    @error($name)
        <div class="field-error">{{ $message }}</div>
    @enderror
</div>
