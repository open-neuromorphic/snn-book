import json

from js import Bokeh, JSON

import panel as pn
from bokeh.embed import json_item
from bokeh.plotting import figure
import numpy as np


arr = np.linspace(0, 4*np.pi, 1000)

horizon = 10
index = horizon

tabulator = pn.widgets.Tabulator(df, height=450, width=400).servable(target='table')

fig = figure(width=900, height=500,
             title = "Line chart")

line = fig.line(x="date", color="dodgerblue", y=arr[:index])

def stream():
    data = arr[index-horizon:index+1]
    tabulator.stream(data, rollover=rollover.value, follow=follow.value)
    value = {k: [v] for k, v in tabulator.value.iloc[-1].to_dict().items()}
    value['index'] = [tabulator.value.index[-1]]
    cds.stream(value)
