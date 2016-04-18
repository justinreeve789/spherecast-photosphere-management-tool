<div class="container">
	<div class="row">
		{!! Form::open(array('id' => 'form-upload', 'url' => 'upload', 'files' => true)) !!}
		{!! Form::label('mediaFile', 'Select File(s)' ) !!}
		{!! Form::file('mediaFile', array('accept' => 'image/*', 'multiple' => false, 'id' => 'mediaFile')) !!}
		{!! Form::submit() !!}
		{!! Form::close() !!}
	</div>
</div>