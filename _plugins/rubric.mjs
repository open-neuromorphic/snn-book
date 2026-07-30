const plugin = {
  name: 'Rubric',
  directives: [
    {
      name: 'rubric',
      doc: 'A heading that is not numbered',
      arg: { type: String, required: true },
      run(data) {
        return [
          {
            type: 'heading',
            depth: 2,
            enumerated: false,
            children: [{ type: 'text', value: data.arg }],
          },
        ];
      },
    },
  ],
};

export default plugin;
